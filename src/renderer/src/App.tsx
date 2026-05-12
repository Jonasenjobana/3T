import { useState, useEffect } from 'react'
import TodoList from './components/TodoList'
import AIInput from './components/AIInput'
import Settings from './components/Settings'
import TimerList from './components/TimerList'
import PomodoroTimer from './components/PomodoroTimer'
import type { Todo, AIConfig, Timer, TimerScheduleType } from './types'

type Page = 'todos' | 'timers' | 'pomodoro'

function App() {
  const [page, setPage] = useState<Page>('todos')
  const [todos, setTodos] = useState<Todo[]>([])
  const [timers, setTimers] = useState<Timer[]>([])
  const [activeTimer, setActiveTimer] = useState<Timer | null>(null)
  const [aiConfig, setAIConfig] = useState<AIConfig>({
    apiKey: '',
    apiBase: 'https://api.openai.com/v1',
    modelName: 'gpt-3.5-turbo'
  })
  const [showSettings, setShowSettings] = useState(false)
  const [shaking, setShaking] = useState(false)

  useEffect(() => {
    window.api.getTodos().then(setTodos).catch((e) => console.error('getTodos failed:', e))
    window.api.getAIConfig().then(setAIConfig).catch((e) => console.error('getAIConfig failed:', e))
    window.api.getTimers().then(setTimers).catch((e) => console.error('getTimers failed:', e))
  }, [])

  useEffect(() => {
    const unsub = window.api.onWindowShake(() => {
      setShaking(true)
      setTimeout(() => setShaking(false), 1000)
    })
    return unsub
  }, [])

  // --- Todo handlers ---
  const refreshTodos = async () => {
    const list = await window.api.getTodos()
    setTodos(list)
  }

  const handleAddTodo = async (content: string) => {
    try {
      const todo = await window.api.addTodo(content)
      setTodos((prev) => [todo, ...prev])
    } catch (e) {
      console.error('addTodo failed:', e)
    }
  }

  const handleToggleTodo = async (id: string) => {
    try {
      const todo = await window.api.toggleTodo(id)
      if (todo) setTodos((prev) => prev.map((t) => (t.id === id ? todo : t)))
    } catch (e) {
      console.error('toggleTodo failed:', e)
    }
  }

  const handleDeleteTodo = async (id: string) => {
    try {
      await window.api.deleteTodo(id)
      setTodos((prev) => prev.filter((t) => t.id !== id))
    } catch (e) {
      console.error('deleteTodo failed:', e)
    }
  }

  const handleUpdateTodo = async (id: string, content: string) => {
    try {
      const todo = await window.api.updateTodo(id, { content })
      if (todo) setTodos((prev) => prev.map((t) => (t.id === id ? todo : t)))
    } catch (e) {
      console.error('updateTodo failed:', e)
    }
  }

  const handleAddSubtask = async (todoId: string, content: string, linkedTaskId?: string) => {
    try {
      const todo = await window.api.addSubtask(todoId, content, linkedTaskId)
      if (todo) setTodos((prev) => prev.map((t) => (t.id === todoId ? todo : t)))
    } catch (e) {
      console.error('addSubtask failed:', e)
    }
  }

  const handleToggleSubtask = async (todoId: string, subtaskId: string) => {
    try {
      const todo = await window.api.toggleSubtask(todoId, subtaskId)
      if (todo) setTodos((prev) => prev.map((t) => (t.id === todoId ? todo : t)))
    } catch (e) {
      console.error('toggleSubtask failed:', e)
    }
  }

  const handleDeleteSubtask = async (todoId: string, subtaskId: string) => {
    try {
      const todo = await window.api.deleteSubtask(todoId, subtaskId)
      if (todo) setTodos((prev) => prev.map((t) => (t.id === todoId ? todo : t)))
    } catch (e) {
      console.error('deleteSubtask failed:', e)
    }
  }

  const handleAutoCompleteTodo = async (todoId: string) => {
    try {
      const todo = await window.api.autoCompleteTodo(todoId)
      if (todo) setTodos((prev) => prev.map((t) => (t.id === todoId ? todo : t)))
    } catch (e) {
      console.error('autoCompleteTodo failed:', e)
    }
  }

  const handleSaveConfig = async (config: AIConfig) => {
    try {
      const saved = await window.api.saveAIConfig(config)
      setAIConfig(saved)
      setShowSettings(false)
    } catch (e) {
      console.error('saveConfig failed:', e)
    }
  }

  // --- Timer handlers ---
  const refreshTimers = async () => {
    const list = await window.api.getTimers()
    setTimers(list)
  }

  const handleAddTimer = async (title: string, scheduleType: TimerScheduleType, durationMinutes: number, fixedDate: number | null, recurringDays: number[], recurringTime: string) => {
    try {
      await window.api.addTimer(title, scheduleType, durationMinutes, fixedDate, recurringDays, recurringTime)
      await refreshTimers()
    } catch (e) {
      console.error('addTimer failed:', e)
    }
  }

  const handleDeleteTimer = async (id: string) => {
    try {
      await window.api.deleteTimer(id)
      await refreshTimers()
      if (activeTimer?.id === id) {
        setActiveTimer(null)
        setPage('timers')
      }
    } catch (e) {
      console.error('deleteTimer failed:', e)
    }
  }

  const handleSelectTimer = (timer: Timer) => {
    setActiveTimer(timer)
    setPage('pomodoro')
  }

  const handleTimerUpdate = (updated: Timer) => {
    setActiveTimer(updated)
    refreshTimers()
  }

  const handleTimerAddSubtask = async (timerId: string, content: string) => {
    try {
      const updated = await window.api.addTimerSubtask(timerId, content)
      if (updated) {
        setActiveTimer(updated)
        await refreshTimers()
      }
    } catch (e) {
      console.error('addTimerSubtask failed:', e)
    }
  }

  const handleTimerToggleSubtask = async (timerId: string, subtaskId: string) => {
    try {
      const updated = await window.api.toggleTimerSubtask(timerId, subtaskId)
      if (updated) {
        setActiveTimer(updated)
        await refreshTimers()
      }
    } catch (e) {
      console.error('toggleTimerSubtask failed:', e)
    }
  }

  const handleTimerDeleteSubtask = async (timerId: string, subtaskId: string) => {
    try {
      const updated = await window.api.deleteTimerSubtask(timerId, subtaskId)
      if (updated) {
        setActiveTimer(updated)
        await refreshTimers()
      }
    } catch (e) {
      console.error('deleteTimerSubtask failed:', e)
    }
  }

  const completedCount = todos.filter((t) => t.completed).length
  const runningTimers = timers.filter((t) => t.status === 'running').length

  return (
    <div className={`app${shaking ? ' shaking' : ''}`}>
      <header className="app-header">
        <h1>Note Task</h1>
        <div className="header-info">
          {runningTimers > 0 && (
            <span className="running-indicator">⏱ {runningTimers}</span>
          )}
          {page === 'todos' && (
            <span className="task-count">
              {completedCount}/{todos.length} 已完成
            </span>
          )}
          <button className="nav-btn" onClick={() => setPage(page === 'timers' || page === 'pomodoro' ? 'todos' : 'timers')} title={page === 'timers' || page === 'pomodoro' ? '任务列表' : '定时任务'}>
            {page === 'timers' || page === 'pomodoro' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 11l3 3L22 4"/>
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            )}
          </button>
          <button className="settings-btn" onClick={() => setShowSettings(true)} title="设置">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>
        </div>
      </header>

      {page === 'todos' && (
        <>
          <AIInput onAdd={handleAddTodo} aiConfig={aiConfig} />
          <TodoList
            todos={todos}
            onToggle={handleToggleTodo}
            onDelete={handleDeleteTodo}
            onUpdate={handleUpdateTodo}
            onAddSubtask={handleAddSubtask}
            onToggleSubtask={handleToggleSubtask}
            onDeleteSubtask={handleDeleteSubtask}
            onAutoComplete={handleAutoCompleteTodo}
          />
        </>
      )}

      {page === 'timers' && (
        <TimerList timers={timers} onSelect={handleSelectTimer} onAdd={handleAddTimer} onDelete={handleDeleteTimer} />
      )}

      {page === 'pomodoro' && activeTimer && (
        <PomodoroTimer
          timer={activeTimer}
          onBack={() => { setPage('timers'); refreshTimers() }}
          onUpdate={handleTimerUpdate}
          onAddSubtask={handleTimerAddSubtask}
          onToggleSubtask={handleTimerToggleSubtask}
          onDeleteSubtask={handleTimerDeleteSubtask}
        />
      )}

      {showSettings && (
        <Settings config={aiConfig} onSave={handleSaveConfig} onClose={() => setShowSettings(false)} />
      )}
    </div>
  )
}

export default App
