import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  // Todos
  getTodos: () => ipcRenderer.invoke('store:getTodos'),
  addTodo: (content: string) => ipcRenderer.invoke('store:addTodo', content),
  updateTodo: (id: string, updates: Record<string, unknown>) =>
    ipcRenderer.invoke('store:updateTodo', id, updates),
  deleteTodo: (id: string) => ipcRenderer.invoke('store:deleteTodo', id),
  toggleTodo: (id: string) => ipcRenderer.invoke('store:toggleTodo', id),

  // Todo Subtasks
  addSubtask: (todoId: string, content: string, linkedTaskId?: string) =>
    ipcRenderer.invoke('store:addSubtask', todoId, content, linkedTaskId),
  toggleSubtask: (todoId: string, subtaskId: string) =>
    ipcRenderer.invoke('store:toggleSubtask', todoId, subtaskId),
  deleteSubtask: (todoId: string, subtaskId: string) =>
    ipcRenderer.invoke('store:deleteSubtask', todoId, subtaskId),
  autoCompleteTodo: (todoId: string) =>
    ipcRenderer.invoke('store:autoCompleteTodo', todoId),

  // AI
  aiComplete: (prompt: string) => ipcRenderer.invoke('ai:complete', prompt),
  getAIConfig: () => ipcRenderer.invoke('ai:getConfig'),
  saveAIConfig: (config: Record<string, string>) => ipcRenderer.invoke('ai:saveConfig', config),

  // Timers
  getTimers: () => ipcRenderer.invoke('timer:getAll'),
  addTimer: (title: string, scheduleType: string, durationMinutes: number, fixedDate: number | null, recurringDays: number[], recurringTime: string) =>
    ipcRenderer.invoke('timer:add', title, scheduleType, durationMinutes, fixedDate, recurringDays, recurringTime),
  startTimer: (id: string) => ipcRenderer.invoke('timer:start', id),
  pauseTimer: (id: string) => ipcRenderer.invoke('timer:pause', id),
  stopTimer: (id: string) => ipcRenderer.invoke('timer:stop', id),
  deleteTimer: (id: string) => ipcRenderer.invoke('timer:delete', id),
  getTimerRemaining: (id: string) => ipcRenderer.invoke('timer:getRemaining', id),

  // Timer Subtasks
  addTimerSubtask: (timerId: string, content: string, linkedTaskId?: string) =>
    ipcRenderer.invoke('timer:addSubtask', timerId, content, linkedTaskId),
  toggleTimerSubtask: (timerId: string, subtaskId: string) =>
    ipcRenderer.invoke('timer:toggleSubtask', timerId, subtaskId),
  deleteTimerSubtask: (timerId: string, subtaskId: string) =>
    ipcRenderer.invoke('timer:deleteSubtask', timerId, subtaskId),

  // Events
  onTimerDone: (callback: (id: string) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, id: string) => callback(id)
    ipcRenderer.on('timer:done', handler)
    return () => ipcRenderer.removeListener('timer:done', handler)
  },
  onTimerRemind: (callback: (id: string) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, id: string) => callback(id)
    ipcRenderer.on('timer:remind', handler)
    return () => ipcRenderer.removeListener('timer:remind', handler)
  },
  onWindowShake: (callback: () => void) => {
    const handler = () => callback()
    ipcRenderer.on('window:shake', handler)
    return () => ipcRenderer.removeListener('window:shake', handler)
  },

  // Settings
  getAutoStart: () => ipcRenderer.invoke('settings:getAutoStart'),
  setAutoStart: (enabled: boolean) => ipcRenderer.invoke('settings:setAutoStart', enabled)
})
