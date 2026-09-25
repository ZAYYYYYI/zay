import { useEffect, useState, useCallback } from "react";
import { ListTodo, Loader2 } from "lucide-react";
import { logger } from "@lark-apaas/client-toolkit/logger";
import { Table } from "@lark-apaas/client-toolkit/antd-table";
import type { TableProps } from "@lark-apaas/client-toolkit/antd-table";
import * as plantDiagnosisApi from "@client/src/api/plant-diagnosis";
import type { CareTask } from "@shared/api.interface";
import {
  TASK_TYPE_LABELS,
  TASK_STATUS_LABELS,
  TASK_STATUS_COLORS,
  DEVICE_LABELS,
  DEVICE_ACTION_LABELS,
} from "@client/src/utils/diagnosis-constants";

const TasksPage = () => {
  const [tasks, setTasks] = useState<CareTask[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await plantDiagnosisApi.listRecords(1, 100);
      const allTasks: CareTask[] = [];
      for (const record of res.items) {
        const recordTasks = await plantDiagnosisApi.getTasksByRecord(record.id);
        allTasks.push(...recordTasks);
      }
      allTasks.sort(
        (a: CareTask, b: CareTask) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      setTasks(allTasks);
    } catch (err) {
      logger.error("获取养护任务失败", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const columns: TableProps<CareTask>["columns"] = [
    {
      title: "任务类型",
      dataIndex: "taskType",
      key: "taskType",
      render: (value: string) => TASK_TYPE_LABELS[value] || value,
    },
    {
      title: "设备",
      dataIndex: "deviceType",
      key: "deviceType",
      render: (value: string) => DEVICE_LABELS[value] || value,
    },
    {
      title: "动作",
      dataIndex: "deviceAction",
      key: "deviceAction",
      render: (value: string) => DEVICE_ACTION_LABELS[value] || value,
    },
    {
      title: "时长",
      dataIndex: "duration",
      key: "duration",
      render: (value: number | null) =>
        value != null ? `${value}分钟` : "-",
    },
    {
      title: "状态",
      dataIndex: "executionStatus",
      key: "executionStatus",
      render: (value: string) => (
        <span
          className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
            TASK_STATUS_COLORS[value] || ""
          }`}
        >
          {TASK_STATUS_LABELS[value] || value}
        </span>
      ),
    },
    {
      title: "创建时间",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (value: string) =>
        new Date(value).toLocaleString("zh-CN"),
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">养护任务</h1>

      <div className="border rounded-xl p-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <ListTodo className="w-8 h-8 text-primary" />
            </div>
            <p className="text-gray-500">暂无养护任务</p>
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={tasks}
            rowKey="id"
            scroll={{ x: 800, y: 500 }}
          />
        )}
      </div>
    </div>
  );
};

export default TasksPage;