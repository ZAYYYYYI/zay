# 妙植 - 智能家居植物检测系统

## 应用概览

家居植物病变检测与每日巡检 Web 应用。用户拍照上传植物图像，AI 智能体分析诊断健康状态（健康/光照不足/缺水/缺素/积水烂根），自动生成养护任务，记录每日检查状况与施肥记录，支持 Excel 导入导出，提供专属养护卡。

## 技术架构

- 前端：React 19 + Tailwind CSS + shadcn/ui
- 后端：NestJS + Drizzle ORM + PostgreSQL
- AI 诊断：平台 AI 图片理解能力
- 文件存储：平台文件存储服务
- Excel：xlsx 库（纯 JS）

## 设计规范

### 主题色彩

- 主色（primary）：绿 #2D8A4E（植物健康、自然）
- 主色浅：绿 #E8F5E9
- 主色深：绿 #1B5E32
- 警告色：黄 #F59E0B（光照不足/缺素）
- 危险色：红 #DC2626（积水烂根）
- 信息色：蓝 #3B82F6（缺水）
- 背景色：白 #FFFFFF / 浅灰 #F9FAFB
- 文字主色：深灰 #1F2937
- 文字辅色：中灰 #6B7280

### 排版字号层级

- 页面标题：text-2xl font-bold
- 区块标题：text-lg font-semibold
- 卡片标题：text-base font-medium
- 正文：text-sm
- 辅助文字：text-xs text-gray-500

### 布局约束

- 内容最大宽度：max-w-4xl mx-auto
- 页面内边距：px-4 py-6
- 卡片内边距：p-6
- 卡片间距：gap-6
- 组件间距：gap-4

## 路由设计

| 路由 | 页面 | 说明 |
|------|------|------|
| / | HomePage | 首页 - 拍照检测入口 + 每日巡检快捷入口 |
| /diagnosis/:id | DiagnosisPage | 诊断结果详情 |
| /inspections | InspectionsPage | 每日巡检 - 检查记录 + Excel 导入导出 |
| /tasks | TasksPage | 养护任务列表 |
| /logs | LogsPage | 养护日志列表 |
| /logs/:id | LogDetailPage | 日志详情 |
| /care-cards | CareCardsPage | 专属养护卡列表 |
| /care-cards/:id | CareCardDetailPage | 养护卡详情 |

## 施肥周期规则

| 肥料类型 | 周期 |
|---------|------|
| organic（有机肥）| 30 天 |
| chemical（化肥）| 15 天 |
| slow_release（缓释肥）| 90 天 |
| liquid（液肥）| 7 天 |