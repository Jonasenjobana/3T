import { app, BrowserWindow, ipcMain, shell, Notification, Tray, Menu } from 'electron'
import { join } from 'path'
import { randomBytes } from 'crypto'
import { loadStore, saveStore, getStore } from './store'
import type { Todo, SubTask, Timer, TimerScheduleType } from '../shared/types'

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
let isQuitting = false
const timerIntervals = new Map<string, ReturnType<typeof setInterval>>()

const isDev = !app.isPackaged

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 680,
    minWidth: 600,
    minHeight: 400,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow!.show()
    if (isDev) {
      mainWindow!.webContents.openDevTools({ mode: 'detach' })
    }
  })

  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault()
      mainWindow?.hide()
    }
  })

  mainWindow.webContents.on('before-input-event', (_event, input) => {
    if (input.key === 'F12') {
      mainWindow!.webContents.toggleDevTools()
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (isDev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(async () => {
  loadStore()
  applyAutoStart()
  setupIPC()
  createWindow()
  await createTray()
  startScheduleChecker()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    } else {
      mainWindow?.show()
      mainWindow?.focus()
    }
  })
})

app.on('before-quit', () => {
  isQuitting = true
})

app.on('window-all-closed', () => {
  // 不自动退出，由托盘菜单控制
})

function activateWindowForNotification(): void {
  if (!mainWindow || mainWindow.isDestroyed()) return

  try {
    if (mainWindow.isMinimized()) {
      mainWindow.restore()
    }
    if (!mainWindow.isVisible()) {
      mainWindow.show()
    }
    mainWindow.setAlwaysOnTop(true)
    mainWindow.focus()
    mainWindow.webContents.send('window:shake')
  } catch {
    // 窗口可能处于不可操作状态，忽略
  }

  setTimeout(() => {
    try {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.setAlwaysOnTop(false)
      }
    } catch { /* ignore */ }
  }, 3000)
}

async function createTray(): Promise<void> {
  // 使用应用自身的可执行文件图标
  const icon = await app.getFileIcon(process.execPath, { size: 'small' })

  tray = new Tray(icon)
  tray.setToolTip('Note Task')

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示主窗口',
      click: () => {
        if (mainWindow) {
          mainWindow.show()
          mainWindow.focus()
        }
      }
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        isQuitting = true
        tray?.destroy()
        tray = null
        app.quit()
      }
    }
  ])

  tray.setContextMenu(contextMenu)

  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore()
      }
      if (!mainWindow.isVisible()) {
        mainWindow.show()
      }
      mainWindow.focus()
    }
  })
}

function setupIPC(): void {
  // --- Todos ---
  ipcMain.handle('store:getTodos', () => {
    return getStore().todos
  })

  ipcMain.handle('store:addTodo', (_, content: string) => {
    const store = getStore()
    const todo: Todo = {
      id: randomBytes(16).toString('hex'),
      content,
      completed: false,
      subtasks: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    store.todos.unshift(todo)
    saveStore()
    return todo
  })

  ipcMain.handle('store:updateTodo', (_, id: string, updates: Record<string, unknown>) => {
    const store = getStore()
    const index = store.todos.findIndex((t) => t.id === id)
    if (index !== -1) {
      Object.assign(store.todos[index], updates, { updatedAt: Date.now() })
      saveStore()
      return store.todos[index]
    }
    return null
  })

  ipcMain.handle('store:deleteTodo', (_, id: string) => {
    const store = getStore()
    store.todos = store.todos.filter((t) => t.id !== id)
    saveStore()
  })

  ipcMain.handle('store:toggleTodo', (_, id: string) => {
    const store = getStore()
    const todo = store.todos.find((t) => t.id === id)
    if (!todo) return null
    if (!todo.completed && todo.subtasks.length > 0) {
      const allDone = todo.subtasks.every((s) => s.completed)
      if (!allDone) return todo
    }
    todo.completed = !todo.completed
    todo.updatedAt = Date.now()
    saveStore()
    return todo
  })

  // --- Subtasks for Todos ---
  ipcMain.handle('store:addSubtask', (_, todoId: string, content: string, linkedTaskId?: string) => {
    const store = getStore()
    const todo = store.todos.find((t) => t.id === todoId)
    if (!todo) return null
    const subtask: SubTask = {
      id: randomBytes(16).toString('hex'),
      content,
      completed: false,
      ...(linkedTaskId ? { linkedTaskId } : {})
    }
    todo.subtasks.push(subtask)
    todo.updatedAt = Date.now()
    saveStore()
    return todo
  })

  ipcMain.handle('store:toggleSubtask', (_, todoId: string, subtaskId: string) => {
    const store = getStore()
    const todo = store.todos.find((t) => t.id === todoId)
    if (!todo) return null
    const subtask = todo.subtasks.find((s) => s.id === subtaskId)
    if (!subtask) return null
    subtask.completed = !subtask.completed
    todo.updatedAt = Date.now()
    if (todo.completed && !subtask.completed) {
      todo.completed = false
    }
    saveStore()
    return todo
  })

  ipcMain.handle('store:deleteSubtask', (_, todoId: string, subtaskId: string) => {
    const store = getStore()
    const todo = store.todos.find((t) => t.id === todoId)
    if (!todo) return null
    todo.subtasks = todo.subtasks.filter((s) => s.id !== subtaskId)
    todo.updatedAt = Date.now()
    saveStore()
    return todo
  })

  ipcMain.handle('store:autoCompleteTodo', (_, todoId: string) => {
    const store = getStore()
    const todo = store.todos.find((t) => t.id === todoId)
    if (!todo) return null
    const allDone = todo.subtasks.length > 0 && todo.subtasks.every((s) => s.completed)
    if (allDone) {
      todo.completed = true
      todo.updatedAt = Date.now()
      saveStore()
    }
    return todo
  })

  // --- AI Config ---
  ipcMain.handle('ai:getConfig', () => {
    return getStore().aiConfig
  })

  ipcMain.handle('ai:saveConfig', (_, config: Record<string, string>) => {
    const store = getStore()
    store.aiConfig = { ...store.aiConfig, ...config }
    saveStore()
    return store.aiConfig
  })

  // --- AI Completion (no deep thinking) ---
  ipcMain.handle('ai:complete', async (_, prompt: string) => {
    const { apiKey, apiBase, modelName } = getStore().aiConfig

    if (!apiKey || !apiBase || !modelName) {
      return { error: '请先在设置中配置 AI' }
    }

    try {
      const url = `${apiBase.replace(/\/+$/, '')}/chat/completions`
      const body: Record<string, unknown> = {
        model: modelName,
        messages: [
          {
            role: 'system',
            content:
              '你是一个任务补全助手。根据用户输入的任务开头，补全完整任务内容。只返回补全的文字部分（不包含用户已输入的内容），不要返回任何解释或其他内容。保持简洁，补全内容不超过30个字。'
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 80,
        temperature: 0.2
      }
      if (modelName.toLowerCase().includes('deepseek') || modelName.toLowerCase().includes('r1')) {
        // disable deep thinking for supported models
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        const errorText = await response.text()
        return { error: `请求失败: ${response.status} ${errorText}` }
      }

      const data = (await response.json()) as { choices: Array<{ message: { content: string } }> }
      const completion = data.choices?.[0]?.message?.content?.trim() || ''
      return { text: completion }
    } catch (err: unknown) {
      return { error: `请求出错: ${err instanceof Error ? err.message : String(err)}` }
    }
  })

  // --- Timers ---
  ipcMain.handle('timer:getAll', () => {
    return getStore().timers
  })

  ipcMain.handle('timer:add', (_, title: string, scheduleType: TimerScheduleType, durationMinutes: number, fixedDate: number | null, recurringDays: number[], recurringTime: string) => {
    const store = getStore()
    const timer: Timer = {
      id: randomBytes(16).toString('hex'),
      title,
      scheduleType,
      durationMinutes,
      fixedDate,
      recurringDays,
      recurringTime,
      subtasks: [],
      status: 'pending',
      startedAt: null,
      pausedAt: null,
      remainingSeconds: durationMinutes * 60,
      completedCount: 0,
      createdAt: Date.now()
    }
    store.timers.unshift(timer)
    saveStore()
    return timer
  })

  ipcMain.handle('timer:start', (_, id: string) => {
    const store = getStore()
    const timer = store.timers.find((t) => t.id === id)
    if (!timer) return null

    if (timer.status === 'paused' && timer.pausedAt) {
      const pausedDuration = Math.floor((Date.now() - timer.pausedAt) / 1000)
      timer.remainingSeconds = Math.max(0, timer.remainingSeconds - pausedDuration)
    } else {
      timer.remainingSeconds = timer.durationMinutes * 60
    }

    timer.status = 'running'
    timer.startedAt = Date.now()
    timer.pausedAt = null
    saveStore()
    startTimerTick(id)
    return timer
  })

  ipcMain.handle('timer:pause', (_, id: string) => {
    const store = getStore()
    const timer = store.timers.find((t) => t.id === id)
    if (!timer || timer.status !== 'running') return null

    if (timer.startedAt) {
      const elapsed = Math.floor((Date.now() - timer.startedAt) / 1000)
      timer.remainingSeconds = Math.max(0, timer.remainingSeconds - elapsed)
    }
    timer.status = 'paused'
    timer.pausedAt = Date.now()
    timer.startedAt = null
    saveStore()
    stopTimerTick(id)
    return timer
  })

  ipcMain.handle('timer:stop', (_, id: string) => {
    const store = getStore()
    const timer = store.timers.find((t) => t.id === id)
    if (!timer) return null

    timer.status = 'pending'
    timer.startedAt = null
    timer.pausedAt = null
    timer.remainingSeconds = timer.durationMinutes * 60
    saveStore()
    stopTimerTick(id)
    return timer
  })

  ipcMain.handle('timer:delete', (_, id: string) => {
    const store = getStore()
    store.timers = store.timers.filter((t) => t.id !== id)
    saveStore()
    stopTimerTick(id)
  })

  ipcMain.handle('timer:getRemaining', (_, id: string) => {
    const store = getStore()
    const timer = store.timers.find((t) => t.id === id)
    if (!timer || timer.status !== 'running' || !timer.startedAt) {
      return timer ? timer.remainingSeconds : 0
    }
    const elapsed = Math.floor((Date.now() - timer.startedAt) / 1000)
    return Math.max(0, timer.remainingSeconds - elapsed)
  })

  // --- Subtasks for Timers ---
  ipcMain.handle('timer:addSubtask', (_, timerId: string, content: string, linkedTaskId?: string) => {
    const store = getStore()
    const timer = store.timers.find((t) => t.id === timerId)
    if (!timer) return null
    const subtask = {
      id: randomBytes(16).toString('hex'),
      content,
      completed: false,
      ...(linkedTaskId ? { linkedTaskId } : {})
    }
    timer.subtasks.push(subtask)
    saveStore()
    return timer
  })

  ipcMain.handle('timer:toggleSubtask', (_, timerId: string, subtaskId: string) => {
    const store = getStore()
    const timer = store.timers.find((t) => t.id === timerId)
    if (!timer) return null
    const subtask = timer.subtasks.find((s) => s.id === subtaskId)
    if (!subtask) return null
    subtask.completed = !subtask.completed
    saveStore()
    return timer
  })

  ipcMain.handle('timer:deleteSubtask', (_, timerId: string, subtaskId: string) => {
    const store = getStore()
    const timer = store.timers.find((t) => t.id === timerId)
    if (!timer) return null
    timer.subtasks = timer.subtasks.filter((s) => s.id !== subtaskId)
    saveStore()
    return timer
  })

  // --- Auto Start ---
  ipcMain.handle('settings:getAutoStart', () => {
    return getStore().autoStart
  })

  ipcMain.handle('settings:setAutoStart', (_, enabled: boolean) => {
    const store = getStore()
    store.autoStart = enabled
    saveStore()
    app.setLoginItemSettings({ openAtLogin: enabled })
    return enabled
  })
}

function startTimerTick(id: string): void {
  stopTimerTick(id)
  const interval = setInterval(() => {
    const store = getStore()
    const timer = store.timers.find((t) => t.id === id)
    if (!timer || timer.status !== 'running') {
      stopTimerTick(id)
      return
    }
    const remaining = timer.startedAt
      ? Math.max(0, timer.remainingSeconds - Math.floor((Date.now() - timer.startedAt) / 1000))
      : 0

    if (remaining <= 0) {
      timer.status = 'done'
      timer.completedCount += 1
      timer.startedAt = null
      timer.remainingSeconds = 0
      saveStore()
      stopTimerTick(id)

      activateWindowForNotification()
      if (Notification.isSupported()) {
        new Notification({ title: 'Note Task', body: `"${timer.title}" 计时结束！` }).show()
      }
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('timer:done', id)
      }
    }
  }, 1000)
  timerIntervals.set(id, interval)
}

function stopTimerTick(id: string): void {
  const interval = timerIntervals.get(id)
  if (interval) {
    clearInterval(interval)
    timerIntervals.delete(id)
  }
}

function applyAutoStart(): void {
  const { autoStart } = getStore()
  app.setLoginItemSettings({ openAtLogin: autoStart })
}

// --- Schedule Checker for fixed/recurring timers ---
function startScheduleChecker(): void {
  const check = () => {
    const store = getStore()
    const now = new Date()
    for (const timer of store.timers) {
      if (timer.status !== 'pending') continue
      if (timer.scheduleType === 'fixed' && timer.fixedDate) {
        const target = new Date(timer.fixedDate)
        if (now >= target) {
          activateWindowForNotification()
          if (Notification.isSupported()) {
            new Notification({ title: 'Note Task', body: `"${timer.title}" 定时提醒！` }).show()
          }
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('timer:remind', timer.id)
          }
          timer.status = 'done'
          timer.completedCount += 1
          saveStore()
        }
      } else if (timer.scheduleType === 'recurring' && timer.recurringDays.length > 0) {
        const day = now.getDay()
        if (timer.recurringDays.includes(day)) {
          const [h, m] = (timer.recurringTime || '09:00').split(':').map(Number)
          const targetMinutes = (h * 60 + m)
          const nowMinutes = (now.getHours() * 60 + now.getMinutes())
          if (nowMinutes === targetMinutes) {
            const lastKey = `recurring_last_${timer.id}`
            const lastFired = (store as unknown as Record<string, unknown>)[lastKey] as string | undefined
            const todayStr = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`
            if (lastFired !== todayStr) {
              activateWindowForNotification()
              if (Notification.isSupported()) {
                new Notification({ title: 'Note Task', body: `"${timer.title}" 定时提醒！` }).show()
              }
              if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('timer:remind', timer.id)
              }
              timer.completedCount += 1
              ;(store as unknown as Record<string, unknown>)[lastKey] = todayStr
              saveStore()
            }
          }
        }
      }
    }
  }
  setInterval(check, 30000)
  check()
}
