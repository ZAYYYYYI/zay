import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Loader2 } from "lucide-react";
import { Table } from "@lark-apaas/client-toolkit/antd-table";
import type { TableProps } from "@lark-apaas/client-toolkit/antd-table";
import { logger } from "@lark-apaas/client-toolkit/logger";
import * as plantDiagnosisApi from "@client/src/api/plant-diagnosis";
import type { CareLog } from "@shared/api.interface";
import {
  LOG_TYPE_LABELS,
  LOG_TYPE_COLORS,
} from "@client/src/utils/diagnosis-constants";

const LogsPage = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<CareLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await plantDiagnosisApi.listRecords(1, 100);
        const allLogs: CareLog[] = [];
        for (const record of res.items) {
          const recordLogs: CareLog[] =
            await plantDiagnosisApi.getLogsByRecord(record.id);
          allLogs.push(...recordLogs);
        }
        allLogs.sort(
          (a: CareLog, b: CareLog) =>
            new Date(b.createdAt).getTime() -
            new Date(a.createdAt).getTime(),
        );
        setLogs(allLogs);
      } catch (err) {
        logger.error("获取养护日志失败", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const columns: TableProps<CareLog>["columns"] = [
    {
      title: "日志类型",
      dataIndex: "logType",
      key: "logType",
      width: 120,
      render: (logType: string) => (
        <span
          className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
            LOG_TYPE_COLORS[logType] || "bg-gray-50 text-gray-600"
          }`}
        >
          {LOG_TYPE_LABELS[logType] || logType}
        </span>
      ),
    },
    {
      title: "内容",
      dataIndex: "content",
      key: "content",
      ellipsis: true,
      render: (content: string) => (
        <div className="max-w-md truncate text-sm">{content}</div>
      ),
    },
    {
      title: "创建时间",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 180,
      render: (createdAt: string) => (
        <span className="text-sm text-gray-500">
          {new Date(createdAt).toLocaleString("zh-CN")}
        </span>
      ),
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">养护日志</h1>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-primary" />
          </div>
          <p className="text-gray-500">暂无养护记录</p>
        </div>
      ) : (
        <Table
          columns={columns}
          dataSource={logs}
          rowKey="id"
          scroll={{ x: 700, y: 500 }}
          onRow={(record: CareLog) => ({
            onClick: () => navigate(`/logs/${record.id}`),
            style: { cursor: "pointer" },
          })}
        />
      )}
    </div>
  );
};

export default LogsPage;