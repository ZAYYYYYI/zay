import { useState, useEffect, useCallback, useRef } from "react";
import {
  Search,
  RotateCw,
  Upload,
  Download,
  Plus,
  ClipboardCheck,
  Loader2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Button } from "@client/src/components/ui/button";
import { Badge } from "@client/src/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@client/src/components/ui/dialog";
import { Input } from "@client/src/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@client/src/components/ui/select";
import { Label } from "@client/src/components/ui/label";
import { Textarea } from "@client/src/components/ui/textarea";
import { toast } from "sonner";
import { logger } from "@lark-apaas/client-toolkit/logger";
import * as inspectionApi from "@client/src/api/inspection";
import type {
  DailyInspection,
  CreateInspectionRequest,
} from "@shared/api.interface";
import * as XLSX from "xlsx";

const SPECIES_COLORS: string[] = [
  "bg-green-100 text-green-800 border-green-200",
  "bg-emerald-100 text-emerald-800 border-emerald-200",
  "bg-teal-100 text-teal-800 border-teal-200",
  "bg-lime-100 text-lime-800 border-lime-200",
  "bg-cyan-100 text-cyan-800 border-cyan-200",
  "bg-sky-100 text-sky-800 border-sky-200",
  "bg-indigo-100 text-indigo-800 border-indigo-200",
  "bg-violet-100 text-violet-800 border-violet-200",
];

const FERTILIZER_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "organic", label: "有机肥" },
  { value: "chemical", label: "化肥" },
  { value: "slow_release", label: "缓释肥" },
  { value: "liquid", label: "液体肥" },
];

const APPLICATION_METHOD_OPTIONS: { value: string; label: string }[] = [
  { value: "soil_surface", label: "土表撒施" },
  { value: "irrigation", label: "随水冲施" },
  { value: "foliar_spray", label: "叶面喷施" },
];

function getLocalDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const EMPTY_FORM: CreateInspectionRequest = {
  recordId: null,
  plantSpecies: "",
  inspectionDate: getLocalDate(),
  plantCondition: "",
  appearance: "",
  leafCondition: "",
  soilCondition: "",
  pestStatus: "",
  notes: "",
  fertilizerName: "",
  fertilizerType: "",
  dosage: "",
  applicationMethod: "",
  applicationDate: getLocalDate(),
};

function getSpeciesColor(species: string, speciesList: string[]): string {
  const idx: number = speciesList.indexOf(species);
  return idx >= 0
    ? SPECIES_COLORS[idx % SPECIES_COLORS.length]
    : "bg-gray-100 text-gray-700 border-gray-200";
}

export default function InspectionsPage() {
  const [inspections, setInspections] = useState<DailyInspection[]>([]);
  const [loading, setLoading] = useState(false);
  const [species, setSpecies] = useState<string[]>([]);
  const [filterSpecies, setFilterSpecies] = useState("all");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [filterKeyword, setFilterKeyword] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [formData, setFormData] =
    useState<CreateInspectionRequest>(EMPTY_FORM);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchInspections = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {};
      if (filterSpecies && filterSpecies !== "all")
        params.plantSpecies = filterSpecies;
      if (filterStartDate) params.startDate = filterStartDate;
      if (filterEndDate) params.endDate = filterEndDate;
      if (filterKeyword) params.keyword = filterKeyword;

      const result = await inspectionApi.listInspections(params);
      setInspections(result.items);
    } catch (error: unknown) {
      logger.error("获取巡检列表失败", error);
      toast.error("获取巡检列表失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  }, [filterSpecies, filterStartDate, filterEndDate, filterKeyword]);

  const fetchSpecies = useCallback(async () => {
    try {
      const list: string[] =
        await inspectionApi.getAllSpecies();
      setSpecies(list);
    } catch (error: unknown) {
      logger.error("获取品种列表失败", error);
    }
  }, []);

  useEffect(() => {
    fetchInspections();
    fetchSpecies();
  }, [fetchInspections, fetchSpecies]);

  const handleQuery = () => {
    fetchInspections();
  };

  const handleRefresh = () => {
    setFilterSpecies("all");
    setFilterStartDate("");
    setFilterEndDate("");
    setFilterKeyword("");
    fetchInspections();
  };

  const handleExport = async () => {
    try {
      const params: Record<string, string | number> = {};
      if (filterSpecies && filterSpecies !== "all")
        params.plantSpecies = filterSpecies;
      if (filterStartDate) params.startDate = filterStartDate;
      if (filterEndDate) params.endDate = filterEndDate;
      if (filterKeyword) params.keyword = filterKeyword;
      await inspectionApi.downloadExport(params);
      toast.success("导出成功");
    } catch (error: unknown) {
      logger.error("导出失败", error);
      toast.error("导出失败，请稍后重试");
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      await inspectionApi.downloadTemplate();
      toast.success("模板下载成功");
    } catch (error: unknown) {
      logger.error("下载模板失败", error);
      toast.error("下载模板失败，请稍后重试");
    }
  };

  const handleImportFile = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file: File | undefined = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev: ProgressEvent<FileReader>) => {
      try {
        const binary: ArrayBuffer | string | undefined =
          ev.target?.result;
        if (!binary) {
          toast.error("文件读取失败");
          return;
        }
        const workbook = XLSX.read(binary, { type: "binary" });
        const sheetName: string = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData: Array<Record<string, string>> =
          XLSX.utils.sheet_to_json(sheet);
        const result = await inspectionApi.importExcel(jsonData);
        toast.success(
          `导入完成：成功 ${result.success} 条，失败 ${result.failed} 条`,
        );
        if (result.errors.length > 0) {
          logger.warn("导入错误详情", result.errors);
        }
        fetchInspections();
      } catch (error: unknown) {
        logger.error("导入数据失败", error);
        toast.error("导入数据失败，请检查文件格式");
      }
    };
    reader.readAsBinaryString(file);

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFormChange = (
    field: keyof CreateInspectionRequest,
    value: string,
  ) => {
    setFormData((prev: CreateInspectionRequest) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!formData.plantSpecies.trim()) {
      toast.error("请输入植物品种");
      return;
    }
    if (!formData.inspectionDate) {
      toast.error("请选择检查日期");
      return;
    }
    if (!formData.plantCondition.trim()) {
      toast.error("请输入植物状态");
      return;
    }

    setSubmitting(true);
    try {
      await inspectionApi.createInspection(formData);
      toast.success("巡检记录创建成功");
      setDialogOpen(false);
      setFormData({ ...EMPTY_FORM });
      fetchInspections();
    } catch (error: unknown) {
      logger.error("创建巡检记录失败", error);
      toast.error("创建失败，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleRow = (id: string) => {
    setExpandedId((prev: string | null) =>
      prev === id ? null : id,
    );
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          每日巡检
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          记录每日植物检查状态，追踪施肥养护进度
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-end gap-4 rounded-xl border bg-white p-4">
        <div className="flex flex-col gap-1.5 min-w-[160px]">
          <Label className="text-xs text-gray-500">品种</Label>
          <Select
            value={filterSpecies}
            onValueChange={(v: string) => setFilterSpecies(v)}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="全部品种" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部品种</SelectItem>
              {species.map((s: string) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-gray-500">开始日期</Label>
          <Input
            type="date"
            className="h-9 w-[152px]"
            value={filterStartDate}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFilterStartDate(e.target.value)
            }
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-gray-500">结束日期</Label>
          <Input
            type="date"
            className="h-9 w-[152px]"
            value={filterEndDate}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFilterEndDate(e.target.value)
            }
          />
        </div>

        <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
          <Label className="text-xs text-gray-500">关键词</Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              className="h-9 pl-8"
              placeholder="搜索检查状态或描述"
              value={filterKeyword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFilterKeyword(e.target.value)
              }
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === "Enter") handleQuery();
              }}
            />
          </div>
        </div>

        <Button
          onClick={handleQuery}
          className="h-9"
          style={{
            backgroundColor: "#2D8A4E",
          }}
        >
          查询
        </Button>

        <Button
          variant="outline"
          onClick={handleRefresh}
          className="h-9"
        >
          <RotateCw className="h-4 w-4" />
          刷新列表
        </Button>
      </div>

      {/* Action Buttons Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="outline"
          onClick={handleDownloadTemplate}
        >
          <Download className="h-4 w-4" />
          下载模板
        </Button>

        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-4 w-4" />
          导入数据
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={handleImportFile}
        />

        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4" />
          导出Excel
        </Button>

        <Button
          onClick={() => {
            setFormData({ ...EMPTY_FORM });
            setDialogOpen(true);
          }}
          style={{ backgroundColor: "#2D8A4E" }}
        >
          <Plus className="h-4 w-4" />
          新增检查
        </Button>
      </div>

      {/* Data Table */}
      <div className="rounded-xl border bg-white overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : inspections.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <ClipboardCheck className="h-16 w-16 mb-4 text-gray-300" />
            <p className="text-sm mb-4">
              暂无巡检记录，点击「新增检查」开始记录
            </p>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
              导入数据
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="w-10 py-3 pl-4"></th>
                  <th className="text-left py-3 px-3 font-medium text-gray-600">
                    检查日期
                  </th>
                  <th className="text-left py-3 px-3 font-medium text-gray-600">
                    植物品种
                  </th>
                  <th className="text-left py-3 px-3 font-medium text-gray-600">
                    植物状态
                  </th>
                  <th className="text-left py-3 px-3 font-medium text-gray-600">
                    叶片状态
                  </th>
                  <th className="text-left py-3 px-3 font-medium text-gray-600">
                    土壤状态
                  </th>
                  <th className="text-left py-3 px-3 font-medium text-gray-600">
                    外观描述
                  </th>
                  <th className="text-left py-3 px-3 font-medium text-gray-600">
                    备注
                  </th>
                </tr>
              </thead>
              <tbody>
                {inspections.map(
                  (item: DailyInspection) => {
                    const isExpanded: boolean =
                      expandedId === item.id;
                    return (
                      <>
                        <tr
                          key={item.id}
                          className="border-b last:border-0 hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => toggleRow(item.id)}
                        >
                          <td className="py-3 pl-4 text-gray-400">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap text-gray-800">
                            {item.inspectionDate}
                          </td>
                          <td className="py-3 px-3">
                            <Badge
                              variant="outline"
                              className={getSpeciesColor(
                                item.plantSpecies,
                                species,
                              )}
                            >
                              {item.plantSpecies}
                            </Badge>
                          </td>
                          <td className="py-3 px-3 max-w-48">
                            <span className="line-clamp-2 text-gray-700">
                              {item.plantCondition}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-gray-700">
                            {item.leafCondition || "-"}
                          </td>
                          <td className="py-3 px-3 text-gray-700">
                            {item.soilCondition || "-"}
                          </td>
                          <td className="py-3 px-3 max-w-48">
                            <span className="line-clamp-2 text-gray-700">
                              {item.appearance || "-"}
                            </span>
                          </td>
                          <td className="py-3 px-3 max-w-40">
                            <span className="line-clamp-2 text-gray-700">
                              {item.notes || "-"}
                            </span>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr key={`${item.id}-detail`}>
                            <td colSpan={8} className="bg-gray-50 px-4 py-3">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                <div>
                                  <span className="text-xs text-gray-400">
                                    虫害情况
                                  </span>
                                  <p className="mt-0.5 text-gray-700">
                                    {item.pestStatus || "-"}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-xs text-gray-400">
                                    植物状态
                                  </span>
                                  <p className="mt-0.5 text-gray-700">
                                    {item.plantCondition}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-xs text-gray-400">
                                    外观描述
                                  </span>
                                  <p className="mt-0.5 text-gray-700">
                                    {item.appearance || "-"}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-xs text-gray-400">
                                    备注
                                  </span>
                                  <p className="mt-0.5 text-gray-700">
                                    {item.notes || "-"}
                                  </p>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  },
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Inspection Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>新增巡检记录</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            {/* 植物品种 */}
            <div className="space-y-1.5">
              <Label>
                植物品种 <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="请输入植物品种"
                value={formData.plantSpecies}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleFormChange("plantSpecies", e.target.value)
                }
              />
            </div>

            {/* 检查日期 */}
            <div className="space-y-1.5">
              <Label>
                检查日期 <span className="text-red-500">*</span>
              </Label>
              <Input
                type="date"
                value={formData.inspectionDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleFormChange("inspectionDate", e.target.value)
                }
              />
            </div>

            {/* 植物状态 */}
            <div className="space-y-1.5">
              <Label>
                植物状态 <span className="text-red-500">*</span>
              </Label>
              <Textarea
                placeholder="请描述植物整体状态"
                rows={2}
                value={formData.plantCondition}
                onChange={(
                  e: React.ChangeEvent<HTMLTextAreaElement>,
                ) =>
                  handleFormChange(
                    "plantCondition",
                    e.target.value,
                  )
                }
              />
            </div>

            {/* 外观描述 */}
            <div className="space-y-1.5">
              <Label>外观描述</Label>
              <Textarea
                placeholder="请描述植物外观"
                rows={2}
                value={formData.appearance ?? ""}
                onChange={(
                  e: React.ChangeEvent<HTMLTextAreaElement>,
                ) =>
                  handleFormChange(
                    "appearance",
                    e.target.value,
                  )
                }
              />
            </div>

            {/* 叶片状态 + 土壤状态 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>叶片状态</Label>
                <Input
                  placeholder="叶片颜色、形态等"
                  value={formData.leafCondition ?? ""}
                  onChange={(
                    e: React.ChangeEvent<HTMLInputElement>,
                  ) =>
                    handleFormChange(
                      "leafCondition",
                      e.target.value,
                    )
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>土壤状态</Label>
                <Input
                  placeholder="干湿度、板结等"
                  value={formData.soilCondition ?? ""}
                  onChange={(
                    e: React.ChangeEvent<HTMLInputElement>,
                  ) =>
                    handleFormChange(
                      "soilCondition",
                      e.target.value,
                    )
                  }
                />
              </div>
            </div>

            {/* 虫害情况 */}
            <div className="space-y-1.5">
              <Label>虫害情况</Label>
              <Input
                placeholder="如有虫害请描述"
                value={formData.pestStatus ?? ""}
                onChange={(
                  e: React.ChangeEvent<HTMLInputElement>,
                ) =>
                  handleFormChange(
                    "pestStatus",
                    e.target.value,
                  )
                }
              />
            </div>

            {/* 施肥信息区 */}
            <div className="border-t pt-4 mt-4">
              <p className="text-sm font-medium text-gray-700 mb-3">
                施肥信息（选填）
              </p>

              <div className="space-y-4">
                {/* 肥料名称 */}
                <div className="space-y-1.5">
                  <Label>肥料名称</Label>
                  <Input
                    placeholder="请输入肥料名称"
                    value={formData.fertilizerName ?? ""}
                    onChange={(
                      e: React.ChangeEvent<HTMLInputElement>,
                    ) =>
                      handleFormChange(
                        "fertilizerName",
                        e.target.value,
                      )
                    }
                  />
                </div>

                {/* 肥料类型 + 用量 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>肥料类型</Label>
                    <Select
                      value={
                        formData.fertilizerType ?? ""
                      }
                      onValueChange={(v: string) =>
                        handleFormChange(
                          "fertilizerType",
                          v,
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="请选择类型" />
                      </SelectTrigger>
                      <SelectContent>
                        {FERTILIZER_TYPE_OPTIONS.map(
                          (opt: {
                            value: string;
                            label: string;
                          }) => (
                            <SelectItem
                              key={opt.value}
                              value={opt.value}
                            >
                              {opt.label}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>用量</Label>
                    <Input
                      placeholder="如 200ml/株"
                      value={formData.dosage ?? ""}
                      onChange={(
                        e: React.ChangeEvent<HTMLInputElement>,
                      ) =>
                        handleFormChange(
                          "dosage",
                          e.target.value,
                        )
                      }
                    />
                  </div>
                </div>

                {/* 施肥方式 + 施肥日期 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>施肥方式</Label>
                    <Select
                      value={
                        formData.applicationMethod ??
                        ""
                      }
                      onValueChange={(v: string) =>
                        handleFormChange(
                          "applicationMethod",
                          v,
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="请选择方式" />
                      </SelectTrigger>
                      <SelectContent>
                        {APPLICATION_METHOD_OPTIONS.map(
                          (opt: {
                            value: string;
                            label: string;
                          }) => (
                            <SelectItem
                              key={opt.value}
                              value={opt.value}
                            >
                              {opt.label}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>施肥日期</Label>
                    <Input
                      type="date"
                      value={formData.applicationDate ?? ""}
                      onChange={(
                        e: React.ChangeEvent<HTMLInputElement>,
                      ) =>
                        handleFormChange(
                          "applicationDate",
                          e.target.value,
                        )
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 备注 */}
            <div className="space-y-1.5">
              <Label>备注</Label>
              <Textarea
                placeholder="其他补充信息"
                rows={2}
                value={formData.notes ?? ""}
                onChange={(
                  e: React.ChangeEvent<HTMLTextAreaElement>,
                ) =>
                  handleFormChange("notes", e.target.value)
                }
              />
            </div>
          </div>

          {/* Dialog Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t mt-4">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
            >
              取消
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              style={{ backgroundColor: "#2D8A4E" }}
            >
              {submitting && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              提交
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}