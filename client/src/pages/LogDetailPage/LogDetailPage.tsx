import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, FileText, ListTodo, Loader2, Clock } from "lucide-react";
import { logger } from "@lark-apaas/client-toolkit/logger";
import * as plantDiagnosisApi from "@client/src/api/plant-diagnosis";
import type { CareLog } from "@shared/api.interface";
import {
  LOG_TYPE_LABELS,
  LOG_TYPE_COLORS,
} from "@client/src/utils/diagnosis-constants";

const LogDetailPage = () => {
  const { id } = useParams();
  const [log, setLog] = useState<CareLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchLog = async () => {
      try {
        const res = await plantDiagnosisApi.listRecords(1, 100);
        for (const record of res.items) {
          const recordLogs: CareLog[] =
            await plantDiagnosisApi.getLogsByRecord(record.id);
          const found: CareLog | undefined = recordLogs.find(
            (l: CareLog) => l.id === id,
          );
          if (found) {
            setLog(found);
            setLoading(false);
            return;
          }
        }
        setNotFound(true);
      } catch (err) {
        logger.error("获取日志详情失败", err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchLog();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <Link
          to="/logs"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary"
        >
          <ArrowLeft className="w-4 h-4" />
          返回日志列表
        </Link>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </div>
    );
  }

  if (notFound || !log) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <Link
          to="/logs"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary"
        >
          <ArrowLeft className="w-4 h-4" />
          返回日志列表
        </Link>
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">日志不存在</h1>
          <p className="text-gray-500">未找到该日志记录</p>
        </div>
      </div>
    );
  }

  const badgeClass =
    LOG_TYPE_COLORS[log.logType] || "bg-gray-50 text-gray-600";

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <Link
        to="/logs"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary"
      >
        <ArrowLeft className="w-4 h-4" />
        返回日志列表
      </Link>

      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-gray-900">日志详情</h1>
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${badgeClass}`}
        >
          {LOG_TYPE_LABELS[log.logType] || log.logType}
        </span>
      </div>

      <div className="border rounded-xl p-6 bg-white space-y-4">
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">日志内容</h3>
          <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">
            {log.content}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <div>
              <h3 className="text-xs text-gray-400">创建时间</h3>
              <p className="text-sm text-gray-700">
                {new Date(log.createdAt).toLocaleString("zh-CN")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-400" />
            <div>
              <h3 className="text-xs text-gray-400">关联记录 ID</h3>
              <p className="text-sm font-mono text-gray-700">
                {log.recordId || "-"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ListTodo className="w-4 h-4 text-gray-400" />
            <div>
              <h3 className="text-xs text-gray-400">关联任务 ID</h3>
              <p className="text-sm font-mono text-gray-700">
                {log.taskId || "-"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-400" />
            <div>
              <h3 className="text-xs text-gray-400">日志 ID</h3>
              <p className="text-sm font-mono text-gray-700">{log.id}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogDetailPage;