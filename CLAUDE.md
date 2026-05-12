# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在本仓库中工作时提供指引。

## 命令

- `npm run dev` — 启动开发模式，支持热重载（electron-vite dev）
- `npm run build` — 生产构建，输出到 `out/` 目录
- `npm run dist` — 打包为可分发安装程序（electron-builder）

当前未配置测试框架。

## 架构

基于 Electron + Vite + React + TypeScript 的桌面应用，采用三进程架构：

- **主进程** (`src/main/index.ts`)：窗口生命周期、所有 IPC 处理器、定时器轮询、调度检查器、系统通知。通过 `src/main/store.ts` 持久化数据——JSON 文件位于 `{userData}/store.json`，启动时加载，每次变更后保存。
- **预加载** (`src/preload/index.ts`)：通过 `contextBridge.exposeInMainWorld('api', ...)` 将所有 IPC 通道桥接为 `window.api.*`。`src/preload/index.d.ts` 和 `src/renderer/src/env.d.ts` 中的类型声明必须与 `src/renderer/src/types.ts` 保持同步。
- **渲染进程** (`src/renderer/src/`)：React 单页应用。`App.tsx` 持有全部状态并向下传递处理函数。未使用路由库——页面切换通过 `page` 状态实现（`'todos' | 'timers' | 'pomodoro'`）。

## 数据流

所有变更遵循：渲染进程调用 `window.api.*` → IPC invoke → 主进程修改 store 并写入磁盘 → 返回更新后的实体 → 渲染进程替换本地状态中的对应项（不可变模式）。

主进程向渲染进程推送的事件：`timer:done`（倒计时结束）、`timer:remind`（固定日期/每周重复提醒触发）。

## 数据模型

核心类型定义在 `src/renderer/src/types.ts`，在 `src/main/store.ts` 中镜像：

- **Todo**：包含 `subtasks: SubTask[]`。子任务未全部完成时无法将主任务标记为完成（在 `store:toggleTodo` 处理器中强制执行）。`autoCompleteTodo` IPC 用于在最后一个子任务完成时自动标记父任务完成。
- **SubTask**：可选 `linkedTaskId` 引用另一个 todo（UI 中显示"已关联"标签）。
- **Timer**：三种 `scheduleType`——`countdown`（番茄钟）、`fixed`（一次性日期时间）、`recurring`（每周重复，`recurringDays` 为 0-6 对应周日到周六，`recurringTime` 格式为 "HH:mm"）。同样包含 `subtasks`。
- **AIConfig**：`apiKey`、`apiBase`、`modelName`——支持任何 OpenAI 兼容 API。

## 关键模式

- 定时器轮询存储在主进程的 `timerIntervals` Map 中。渲染进程对运行中的倒计时每 1 秒轮询 `getTimerRemaining`。调度检查器每 30 秒检查固定日期/每周重复的定时器。
- 每周重复定时器使用 `recurring_last_{timerId}` 键防止同一天重复触发。
- AI 自动补全防抖 800ms，结果以 35ms/字的打字动画渲染，按 `Tab` 接受建议。
- `store.ts` 中的数据迁移逻辑处理旧数据文件中缺少的 `subtasks`/`scheduleType`/`recurringDays` 字段。

## 新增 IPC 通道步骤

1. 在 `src/main/index.ts` 的 `setupIPC()` 中添加处理器
2. 在 `src/preload/index.ts` 的 `contextBridge` 中添加方法
3. 在 `src/preload/index.d.ts` 和 `src/renderer/src/env.d.ts` 中添加类型
4. 在 `src/renderer/src/types.ts` 中添加新数据类型，并在 `src/main/store.ts` 中镜像
