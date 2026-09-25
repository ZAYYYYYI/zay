import type { ShieldCheck, Sun, Droplets, Leaf, AlertTriangle } from "lucide-react";

export const DIAGNOSIS_LABELS: Record<string, string> = {
  healthy: "植物健康",
  low_light: "光照不足",
  water_shortage: "缺水",
  nutrient_deficiency: "养分不足",
  water_logging: "积水烂根风险",
};

export const DIAGNOSIS_COLORS: Record<string, string> = {
  healthy: "text-primary bg-primary/10",
  low_light: "text-amber-600 bg-amber-50",
  water_shortage: "text-blue-600 bg-blue-50",
  nutrient_deficiency: "text-amber-600 bg-amber-50",
  water_logging: "text-red-600 bg-red-50",
};

export const DIAGNOSIS_ICONS: Record<string, string> = {
  healthy: "ShieldCheck",
  low_light: "Sun",
  water_shortage: "Droplets",
  nutrient_deficiency: "Leaf",
  water_logging: "AlertTriangle",
};

export const TASK_TYPE_LABELS: Record<string, string> = {
  light: "补光",
  water: "浇水",
  fertilize: "施肥",
  drain: "排水",
};

export const TASK_STATUS_LABELS: Record<string, string> = {
  pending: "待执行",
  executing: "执行中",
  completed: "已完成",
  failed: "失败",
};

export const TASK_STATUS_COLORS: Record<string, string> = {
  pending: "text-gray-500",
  executing: "text-blue-600 bg-blue-50",
  completed: "text-primary bg-primary/10",
  failed: "text-red-600 bg-red-50",
};

export const DEVICE_LABELS: Record<string, string> = {
  curtain: "智能窗帘",
  grow_light: "补光灯",
  water_pump: "微型水泵",
  fertilizer: "施肥器",
  drain_valve: "排水阀",
  fan: "通风风扇",
};

export const DEVICE_ACTION_LABELS: Record<string, string> = {
  open: "打开",
  close: "关闭",
  on: "开启",
  off: "关闭",
  spray: "喷洒",
};

export const LOG_TYPE_LABELS: Record<string, string> = {
  detection: "检测记录",
  task_execution: "任务执行",
  recheck: "复查记录",
};

export const LOG_TYPE_COLORS: Record<string, string> = {
  detection: "bg-blue-50 text-blue-600",
  task_execution: "bg-primary/10 text-primary",
  recheck: "bg-amber-50 text-amber-600",
};