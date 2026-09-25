import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  ShieldCheck,
  Sun,
  Droplets,
  Leaf,
  AlertTriangle,
  FileText,
  BookOpen,
  Loader2,
  Thermometer,
  Clock,
} from "lucide-react";
import * as plantDiagnosisApi from "@client/src/api/plant-diagnosis";
import type {
  PlantRecordDetailResponse,
  CareTask,
  CareLog,
} from "@shared/api.interface";
import {
  DIAGNOSIS_LABELS,
  DIAGNOSIS_COLORS,
  DIAGNOSIS_ICONS,
  TASK_TYPE_LABELS,
  TASK_STATUS_LABELS,
  TASK_STATUS_COLORS,
  DEVICE_LABELS,
  DEVICE_ACTION_LABELS,
  LOG_TYPE_LABELS,
  LOG_TYPE_COLORS,
} from "@client/src/utils/diagnosis-constants";
import Image from "@client/src/components/ui/image";
import { Badge } from "@client/src/components/ui/badge";
import { cn } from "@/lib/utils";

const iconComponents: Record<string, React.ComponentType<{ className?: string }>> = {
  ShieldCheck,
  Sun,
  Droplets,
  Leaf,
  AlertTriangle,
};

const taskTypeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  light: Sun,
  water: Droplets,
  fertilize: Leaf,
  drain: AlertTriangle,
};

const formatDate = (dateStr: string): string => {
  try {
    return new Date(dateStr).toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
};

const TaskIcon = ({ taskType }: { taskType: string }) => {
  const Icon = taskTypeIcons[taskType];
  return Icon ? <Icon className="w-4 h-4" /> : <FileText className="w-4 h-4" />;
};

const DiagnosisPage = () => {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const [data, setData] = useState<PlantRecordDetailResponse | null>(null);

  useEffect(() => {
    if (!id) {
      setError(true);
      setLoading(false);
      return;
    }
    plantDiagnosisApi
      .getRecordDetail(id)
      .then((res: PlantRecordDetailResponse) => {
        setData(res);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          返回首页
        </Link>
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">记录不存在</h1>
          <p className="text-sm text-gray-500">
            未找到该诊断记录，请确认链接是否正确
          </p>
          <Link
            to="/"
            className="inline-block mt-4 text-sm text-primary hover:underline"
          >
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  const { record, tasks, logs, careCard } = data;
  const diagType: string = record.diagnosisType || "healthy";
  const DiagIcon = iconComponents[DIAGNOSIS_ICONS[diagType]] || Leaf;
  const diagColorClasses = DIAGNOSIS_COLORS[diagType] || "text-gray-600 bg-gray-50";

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        返回首页
      </Link>

      {/* Plant Image */}
      {record.imageUrl ? (
        <div className="border rounded-xl overflow-hidden">
          <Image
            src={record.imageUrl}
            alt={record.plantSpecies || "植物图像"}
            className="w-full max-h-96 object-cover"
          />
        </div>
      ) : (
        <div className="border rounded-xl p-12 flex flex-col items-center justify-center bg-gray-50">
          <FileText className="w-10 h-10 text-gray-300 mb-2" />
          <span className="text-sm text-gray-400">暂无图片</span>
        </div>
      )}

      {/* Diagnosis Result Card */}
      <div className="border rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              diagColorClasses.split(" ")[1] || "bg-primary/10",
            )}
          >
            <DiagIcon
              className={cn(
                "w-5 h-5",
                diagColorClasses.split(" ")[0] || "text-primary",
              )}
            />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">诊断结果</h2>
            <p className="text-xs text-gray-400">
              {formatDate(record.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Badge
            variant="outline"
            className={cn("px-3 py-1 rounded-full text-sm font-medium border-0", diagColorClasses)}
          >
            {DIAGNOSIS_LABELS[diagType] || diagType}
          </Badge>
          {record.plantSpecies && (
            <span className="text-sm text-gray-600">
              <Leaf className="w-4 h-4 inline mr-1 text-primary" />
              {record.plantSpecies}
            </span>
          )}
        </div>

        {record.diagnosisDetail && (
          <div>
            <h3 className="text-base font-medium text-gray-800 mb-1.5">
              详细描述
            </h3>
            <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
              {record.diagnosisDetail}
            </p>
          </div>
        )}

        {record.causeAnalysis && (
          <div>
            <h3 className="text-base font-medium text-gray-800 mb-1.5 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              成因分析
            </h3>
            <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
              {record.causeAnalysis}
            </p>
          </div>
        )}

        {record.careSuggestion && (
          <div>
            <h3 className="text-base font-medium text-gray-800 mb-1.5 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-primary" />
              养护建议
            </h3>
            <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
              {record.careSuggestion}
            </p>
          </div>
        )}
      </div>

      {/* Care Tasks */}
      <div className="border rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <ListTodoIcon />
          养护任务
          {tasks.length > 0 && (
            <span className="text-sm font-normal text-gray-400">
              ({tasks.length})
            </span>
          )}
        </h2>
        {tasks.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">
            暂无养护任务
          </p>
        ) : (
          <ul className="space-y-2">
            {tasks.map((task: CareTask) => (
              <li
                key={task.id}
                className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
              >
                <div className="mt-0.5 text-gray-500">
                  <TaskIcon taskType={task.taskType} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-gray-900">
                      {TASK_TYPE_LABELS[task.taskType] || task.taskType}
                    </span>
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded text-xs font-medium",
                        TASK_STATUS_COLORS[task.executionStatus] || "text-gray-600 bg-gray-100",
                      )}
                    >
                      {TASK_STATUS_LABELS[task.executionStatus] || task.executionStatus}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {DEVICE_LABELS[task.deviceType] || task.deviceType}
                    {" · "}
                    {DEVICE_ACTION_LABELS[task.deviceAction] || task.deviceAction}
                    {task.duration != null && ` · ${task.duration}s`}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatDate(task.createdAt)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Care Logs */}
      <div className="border rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          养护日志
          {logs.length > 0 && (
            <span className="text-sm font-normal text-gray-400">
              ({logs.length})
            </span>
          )}
        </h2>
        {logs.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">
            暂无养护日志
          </p>
        ) : (
          <ul className="space-y-2">
            {logs.map((log: CareLog) => (
              <li
                key={log.id}
                className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
              >
                <FileText className="w-4 h-4 mt-0.5 text-gray-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700">{log.content}</p>
                  <p className="text-xs text-gray-400 mt-1 flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(log.createdAt)}
                    </span>
                    {log.logType && (
                      <span
                        className={cn(
                          "px-1.5 py-0.5 rounded text-xs font-medium",
                          LOG_TYPE_COLORS[log.logType] || "bg-gray-100 text-gray-600",
                        )}
                      >
                        {LOG_TYPE_LABELS[log.logType] || log.logType}
                      </span>
                    )}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Care Card */}
      {careCard && (
        <div className="border rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            专属养护卡
          </h2>
          <div className="space-y-3">
            {careCard.wateringGuide && (
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <Droplets className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-gray-800 mb-0.5">
                    浇水指南
                  </h4>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
                    {careCard.wateringGuide}
                  </p>
                </div>
              </div>
            )}
            {careCard.lightingGuide && (
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <Sun className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-gray-800 mb-0.5">
                    光照指南
                  </h4>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
                    {careCard.lightingGuide}
                  </p>
                </div>
              </div>
            )}
            {careCard.fertilizingGuide && (
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <Leaf className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-gray-800 mb-0.5">
                    施肥指南
                  </h4>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
                    {careCard.fertilizingGuide}
                  </p>
                </div>
              </div>
            )}
            {careCard.temperatureGuide && (
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <Thermometer className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-gray-800 mb-0.5">
                    温度指南
                  </h4>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
                    {careCard.temperatureGuide}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const ListTodoIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-primary"
  >
    <rect width="7" height="7" x="3" y="3" rx="1" />
    <path d="M14 4h7" />
    <path d="M14 9h7" />
    <path d="M14 15h7" />
    <path d="M14 20h7" />
    <rect width="7" height="7" x="3" y="14" rx="1" />
  </svg>
);

export default DiagnosisPage;