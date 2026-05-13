# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在本仓库中工作时提供指引。

## 命令

- `npm run dev` — 启动开发模式，支持热重载（electron-vite dev）
- `npm run build` — 生产构建，输出到 `out/` 目录
- `npm run dist` — 打包为可分发安装程序（electron-builder）

当前未配置测试框架。

## 架构

基于 Electron + Vite + React + TypeScript 的桌面应用，采用三进程架构：

- **主进程** (`src/main/index.ts`)：窗口生命周期、所有 IPC 处理器、定时器轮询、调度检查器、系统通知、单实例锁。通过 `src/main/store.ts` 持久化数据——JSON 文件位于 `{userData}/store.json`，启动时加载，每次变更后保存。
- **预加载** (`src/preload/index.ts`)：通过 `contextBridge.exposeInMainWorld('api', ...)` 将所有 IPC 通道桥接为 `window.api.*`。`src/preload/index.d.ts` 和 `src/renderer/src/env.d.ts` 中的类型声明必须与 `src/shared/types.ts` 保持同步。
- **渲染进程** (`src/renderer/src/`)：React 单页应用。`App.tsx` 持有全部状态并向下传递处理函数。未使用路由库——页面切换通过 `page` 状态实现（`'todos' | 'timers' | 'pomodoro'`）。

## 数据流

所有变更遵循：渲染进程调用 `window.api.*` → IPC invoke → 主进程修改 store 并写入磁盘 → 返回更新后的实体 → 渲染进程替换本地状态中的对应项（不可变模式）。

主进程向渲染进程推送的事件：`timer:done`（倒计时结束）、`timer:remind`（固定日期/每周重复提醒触发）、`window:shake`（通知时窗口抖动）。

## 数据模型

核心类型定义在 `src/shared/types.ts`，在 `src/main/store.ts` 中镜像：

- **Todo**：包含 `subtasks: SubTask[]`、可选 `linkedDoc: LinkedDoc`。子任务未全部完成时无法将主任务标记为完成（在 `store:toggleTodo` 处理器中强制执行）。`autoCompleteTodo` IPC 用于在最后一个子任务完成时自动标记父任务完成。
- **SubTask**：可选 `linkedTaskId` 引用另一个 todo（UI 中显示"已关联"标签），可选 `linkedDoc`。
- **LinkedDoc**：`id`、`filePath`（绝对路径）、`fileName`、可选 `summary`（AI 总结缓存）、`createdAt`、`updatedAt`。文档存储在 `{docStoragePath}/{parentId}/` 目录下。
- **Timer**：三种 `scheduleType`——`countdown`（番茄钟）、`fixed`（一次性日期时间）、`recurring`（每周重复，`recurringDays` 为 0-6 对应周日到周六，`recurringTime` 格式为 "HH:mm"）。包含 `subtasks`、`status`、`remainingSeconds`、`completedCount`。
- **AIConfig**：`apiKey`、`apiBase`、`modelName`——支持任何 OpenAI 兼容 API。

### Store 字段

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `todos` | `Todo[]` | `[]` | 任务列表 |
| `aiConfig` | `AIConfig` | 空 key | AI 配置 |
| `timers` | `Timer[]` | `[]` | 定时器列表 |
| `autoStart` | `boolean` | `false` | 开机自启 |
| `docStoragePath` | `string` | `''` | 文档存储目录，空则用 `{userData}/docs` |
| `aiAutoComplete` | `boolean` | `false` | AI 自动补全开关，默认关闭需手动触发 |

## 关键模式

- **单实例锁**：`app.requestSingleInstanceLock()` 防止多开，第二个实例激活已有窗口。
- **托盘**：关闭窗口最小化到托盘，托盘菜单支持"显示主窗口"/"退出"。
- **定时器轮询**：存储在 `timerIntervals` Map 中。渲染进程对运行中的倒计时每 1 秒轮询 `getTimerRemaining`。调度检查器每 30 秒检查 fixed/recurring 定时器。
- **每周重复定时器**：使用 `recurring_last_{timerId}` 键防止同一天重复触发。
- **AI 补全**：防抖 800ms，结果以 35ms/字的打字动画渲染，`Tab` 接受建议。所有 AI 请求默认 `thinking: { type: 'disabled' }` 禁用深度思考以加速响应。`aiAutoComplete` 为 `false` 时输入框右侧显示 ✦ 按钮手动触发。
- **数据迁移**：`store.ts` 中 `migrateData()` 处理旧数据缺少的字段（`subtasks`、`scheduleType`、`recurringDays`、`docStoragePath`、`aiAutoComplete`），以及 `content` 字段被错误覆盖为对象的修复。

## 文档功能

Todo/SubTask 可关联 md 文档（`linkedDoc: LinkedDoc`），通过 `docs:*` IPC 通道操作：

- **新建文档**：点击"新建文档"后弹出命名输入行，用户自定义文件名（自动补 `.md`），重名自动加 `_1` 序号
- **导入文档**：选择已有 `.md`/`.markdown` 文件复制到存储目录
- **文档区**：展开后显示文件名（可点击用系统默认应用打开）、AI 总结按钮、打开文件夹按钮、删除按钮
- **AI 总结**：调用 AI API 对文档内容做 ≤100 字总结，结果持久化到 `LinkedDoc.summary`
- **文件丢失**：展开时检测文件是否存在，不存在显示警告
- **存储路径**：设置 → 文档存储位置可自定义，默认为 `{userData}/docs`

## 设置功能

设置面板（`Settings.tsx`）包含：
- **通用**：开机自启动开关、文档存储位置（选择目录/重置）
- **AI 配置**：AI 自动补全开关、API Key（可显隐）、API 地址、模型名称
- **数据管理**：清除所有数据按钮（原生确认弹窗，清空 todos/timers/aiConfig/docStoragePath）

## 新增 IPC 通道步骤

1. 在 `src/main/index.ts` 的 `setupIPC()` 中添加处理器
2. 在 `src/preload/index.ts` 的 `contextBridge` 中添加方法
3. 在 `src/preload/index.d.ts` 和 `src/renderer/src/env.d.ts` 中添加类型
4. 在 `src/shared/types.ts` 中添加新数据类型，并在 `src/main/store.ts` 中镜像
