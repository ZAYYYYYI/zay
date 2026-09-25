import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, Loader2, Sparkles, ShieldCheck, Sun, Droplets, Leaf, AlertTriangle, ClipboardCheck, Download } from "lucide-react";
import { Button } from "@client/src/components/ui/button";
import { toast } from "sonner";
import { logger } from "@lark-apaas/client-toolkit/logger";
import { getDataloom } from "@lark-apaas/client-toolkit/dataloom";
import { getDefaultBucketId } from "@lark-apaas/client-toolkit/tools/storage";
import { capabilityClient } from "@lark-apaas/client-toolkit";
import * as plantDiagnosisApi from "@client/src/api/plant-diagnosis";
import type { PlantRecord, DiagnosisCompleteResponse } from "@shared/api.interface";
import type { PlantDiseaseDetectionOneOutput } from "@shared/plugin-types";
import type { DiagnosisJSON, CareTaskJSON } from "@shared/api.interface";
import CameraCapture from "@client/src/components/CameraCapture";
import {
  DIAGNOSIS_LABELS,
  DIAGNOSIS_COLORS,
  DIAGNOSIS_ICONS,
  TASK_TYPE_LABELS,
  TASK_STATUS_COLORS,
  DEVICE_LABELS,
  DEVICE_ACTION_LABELS,
} from "@client/src/utils/diagnosis-constants";
import { Image } from '@client/src/components/ui/image';
import { UniversalLink } from '@lark-apaas/client-toolkit/components/UniversalLink';

type PageState = "idle" | "capturing" | "uploading" | "diagnosing" | "completed";

const iconMap: Record<string, typeof ShieldCheck> = {
  ShieldCheck,
  Sun,
  Droplets,
  Leaf,
  AlertTriangle,
};

const HomePage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pageState, setPageState] = useState<PageState>("idle");
  const [streamText, setStreamText] = useState("");
  const [result, setResult] = useState<DiagnosisCompleteResponse | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [records, setRecords] = useState<PlantRecord[]>([]);
  const [uploadMode, setUploadMode] = useState<"camera" | "upload">("camera");

  const fetchRecords = useCallback(async () => {
    try {
      const res = await plantDiagnosisApi.listRecords(1, 10);
      setRecords(res.items);
    } catch (err) {
      logger.error("获取检测记录失败", err);
    }
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const extractJSON = (text: string): string | null => {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? jsonMatch[0] : null;
  };

  const parseDiagnosis = (jsonStr: string): DiagnosisJSON | null => {
    try {
      const parsed: DiagnosisJSON = JSON.parse(jsonStr);
      if (!parsed.plantSpecies || !parsed.diagnosisType) return null;
      const validTypes = ["healthy", "low_light", "water_shortage", "nutrient_deficiency", "water_logging"];
      if (!validTypes.includes(parsed.diagnosisType)) return null;
      return parsed;
    } catch {
      return null;
    }
  };

  const handleCapture = async (file: File) => {
    setPageState("uploading");
    setStreamText("");
    setResult(null);
    setPreviewUrl(URL.createObjectURL(file));

    try {
      const dataloom = await getDataloom();
      const { data, error } = await dataloom
        .storage
        .from(getDefaultBucketId())
        .uploadFile(file);

      if (error || !data) {
        throw new Error("上传失败: " + (error?.message || String(error)));
      }

      setPageState("diagnosing");

      const record = await plantDiagnosisApi.createRecord(data.download_url);

      const streamResult = capabilityClient
        .load("plant_disease_detection_1")
        .callStream<PlantDiseaseDetectionOneOutput>("imageUnderstanding", {
          plant_images: [data.download_url],
        });

      let fullText = "";
      const iterable: AsyncIterable<PlantDiseaseDetectionOneOutput> =
        "output" in streamResult
          ? (streamResult as { output: AsyncIterable<PlantDiseaseDetectionOneOutput> }).output
          : (streamResult as AsyncIterable<PlantDiseaseDetectionOneOutput>);

      for await (const chunk of iterable) {
        fullText += chunk.content ?? "";
        setStreamText(fullText);
      }

      const jsonStr = extractJSON(fullText);
      if (!jsonStr) {
        throw new Error("AI 返回格式错误，无法解析诊断结果");
      }

      const diagnosis = parseDiagnosis(jsonStr);
      if (!diagnosis) {
        throw new Error("AI 诊断结果不完整，请重新拍摄");
      }

      const tasks: CareTaskJSON[] = (diagnosis.careTasks || [])
        .filter((ct) => ct.taskType && ct.deviceType && ct.deviceAction)
        .map((ct) => ({
          taskType: ct.taskType,
          deviceType: ct.deviceType,
          deviceAction: ct.deviceAction,
          duration: ct.duration ? Math.round(ct.duration) : 30,
        }));

      const completeResult = await plantDiagnosisApi.completeDiagnosis(record.id, {
        plantSpecies: diagnosis.plantSpecies,
        diagnosisType: diagnosis.diagnosisType,
        diagnosisDetail: diagnosis.diagnosisDetail || "",
        causeAnalysis: diagnosis.causeAnalysis || "",
        careSuggestion: diagnosis.careSuggestion || "",
        careTasks: tasks,
      });

      setResult(completeResult);
      setPageState("completed");
      fetchRecords();
      toast.success("诊断完成，已生成养护方案");
    } catch (err) {
      logger.error("检测失败", err);
      toast.error(err instanceof Error ? err.message : "检测失败，请重试");
      setPageState("idle");
      setPreviewUrl(null);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    handleCapture(file);
  };

  const DiagnosisIcon = result
    ? iconMap[DIAGNOSIS_ICONS[result.record.diagnosisType || ""]] || ShieldCheck
    : null;

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">智能植物健康检测</h1>
        <p className="mt-2 text-sm text-gray-500">
          拍照识别植物健康状态，AI 一键诊断并生成养护方案
        </p>
        <div className="mt-4 flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/inspections")}
          >
            <ClipboardCheck className="w-4 h-4 mr-1" />
            每日巡检
          </Button>
        </div>
      </div>

      {pageState === "idle" && (
        <div className="space-y-6">
          <div className="flex justify-center gap-3">
            <Button
              variant={uploadMode === "camera" ? "default" : "outline"}
              size="sm"
              onClick={() => setUploadMode("camera")}
            >
              拍照检测
            </Button>
            <Button
              variant={uploadMode === "upload" ? "default" : "outline"}
              size="sm"
              onClick={() => setUploadMode("upload")}
            >
              上传照片
            </Button>
          </div>

          {uploadMode === "camera" ? (
            <CameraCapture onCapture={handleCapture} disabled={false} />
          ) : (
            <div
              className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Upload className="w-8 h-8 text-primary" />
              </div>
              <p className="text-base font-medium text-gray-700">点击上传植物照片</p>
              <p className="mt-1 text-sm text-gray-400">支持 JPG、PNG 格式</p>
            </div>
          )}
        </div>
      )}

      {pageState === "uploading" && (
        <div className="flex flex-col items-center py-16 gap-4">
          {previewUrl && (
            <Image src={previewUrl} alt="预览" className="w-48 h-48 rounded-xl object-cover" />
          )}
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-gray-500">正在上传图片...</p>
        </div>
      )}

      {pageState === "diagnosing" && (
        <div className="border rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-primary animate-pulse" />
            <h2 className="text-lg font-semibold text-gray-900">AI 诊断中...</h2>
          </div>
          {previewUrl && (
            <Image src={previewUrl} alt="诊断图片" className="w-full max-h-60 rounded-lg object-cover" />
          )}
          <div className="bg-gray-50 rounded-lg p-4 min-h-[80px] max-h-[300px] overflow-y-auto">
            <p className="text-sm text-gray-600 whitespace-pre-wrap font-mono">
              {streamText || "正在分析植物图像..."}
            </p>
          </div>
        </div>
      )}

      {pageState === "completed" && result && DiagnosisIcon && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-10 h-10 rounded-full ${DIAGNOSIS_COLORS[result.record.diagnosisType || "healthy"]} flex items-center justify-center`}>
                <DiagnosisIcon className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg font-semibold">
                  {DIAGNOSIS_LABELS[result.record.diagnosisType || "healthy"]}
                </span>
                <span className="ml-2 text-sm text-gray-500">{result.record.plantSpecies}</span>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate(`/diagnosis/${result.record.id}`)}>
              查看详情
            </Button>
          </div>

          <div className="border rounded-xl p-6 space-y-4">
            <Section title="诊断详情" content={result.record.diagnosisDetail || ""} />
            <Section title="成因分析" content={result.record.causeAnalysis || ""} />
            <Section title="养护建议" content={result.record.careSuggestion || ""} />
          </div>

          {result.tasks.length > 0 && (
            <div className="border rounded-xl p-6 space-y-4">
              <h3 className="text-base font-semibold text-gray-900">🤖 智能体已生成养护任务</h3>
              <div className="space-y-2">
                {result.tasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${TASK_STATUS_COLORS[task.executionStatus] || "text-gray-500"}`}>
                      {task.executionStatus === "pending" ? "待执行" : task.executionStatus}
                    </span>
                    <span className="text-sm font-medium text-gray-800">
                      {TASK_TYPE_LABELS[task.taskType] || task.taskType}
                    </span>
                    <span className="text-xs text-gray-400">
                      {DEVICE_LABELS[task.deviceType] || task.deviceType} · {DEVICE_ACTION_LABELS[task.deviceAction] || task.deviceAction}
                      {task.duration ? ` · ${task.duration}分钟` : ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.careCard && (
            <div className="border border-primary/30 rounded-xl p-6 bg-primary/5 space-y-3">
              <h3 className="text-base font-semibold text-primary">
                📋 养护卡 · {result.careCard.plantSpecies}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700">
                {result.careCard.wateringGuide && (
                  <div className="flex gap-2">
                    <Droplets className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    <span>{result.careCard.wateringGuide}</span>
                  </div>
                )}
                {result.careCard.lightingGuide && (
                  <div className="flex gap-2">
                    <Sun className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <span>{result.careCard.lightingGuide}</span>
                  </div>
                )}
                {result.careCard.fertilizingGuide && (
                  <div className="flex gap-2">
                    <Leaf className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>{result.careCard.fertilizingGuide}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-center">
            <Button
              onClick={() => {
                setPageState("idle");
                setResult(null);
                setStreamText("");
                setPreviewUrl(null);
              }}
              size="lg"
            >
              继续检测
            </Button>
          </div>
        </div>
      )}

      <div className="flex justify-center">
        <UniversalLink
          to="/github-download"
          className="inline-flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-primary rounded-lg text-primary hover:bg-primary/5 transition-colors text-sm font-medium"
        >
          <Download className="w-4 h-4" />
          下载 GitHub 源码压缩包 (550KB)
        </UniversalLink>
      </div>

      {records.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">最近检测记录</h2>
          <div className="space-y-3">
            {records.filter((r) => r.status === "completed").slice(0, 5).map((r) => (
              <div
                key={r.id}
                className="flex items-center gap-4 p-4 border rounded-lg cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
                onClick={() => navigate(`/diagnosis/${r.id}`)}
              >
                {r.imageUrl && (
                  <Image src={r.imageUrl} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{r.plantSpecies || "未知品种"}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{new Date(r.createdAt).toLocaleString("zh-CN")}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium shrink-0 ${DIAGNOSIS_COLORS[r.diagnosisType || ""] || "bg-gray-50 text-gray-500"}`}>
                  {DIAGNOSIS_LABELS[r.diagnosisType || ""] || "未知"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const Section = ({ title, content }: { title: string; content: string }) => (
  <div>
    <h4 className="text-sm font-medium text-gray-700 mb-1">{title}</h4>
    <p className="text-sm text-gray-600 leading-relaxed">{content}</p>
  </div>
);

export default HomePage;