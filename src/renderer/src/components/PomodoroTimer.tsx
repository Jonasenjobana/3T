import { useState, useEffect, useRef, useCallback } from 'react'
import type { Timer } from '../types'
import '../styles/PomodoroTimer.css'

interface PomodoroTimerProps {
  timer: Timer
  onBack: () => void
  onUpdate: (timer: Timer) => void
  onAddSubtask: (timerId: string, content: string) => void
  onToggleSubtask: (timerId: string, subtaskId: string) => void
  onDeleteSubtask: (timerId: string, subtaskId: string) => void
}

function PomodoroTimer({ timer, onBack, onUpdate, onAddSubtask, onToggleSubtask, onDeleteSubtask }: PomodoroTimerProps) {
  const [remaining, setRemaining] = useState(timer.remainingSeconds)
  const [done, setDone] = useState(timer.status === 'done')
  const [showSubtasks, setShowSubtasks] = useState(false)
  const [subtaskInput, setSubtaskInput] = useState('')
  const tickRef = useRef<ReturnType<typeof setInterval>>()

  const fetchRemaining = useCallback(async () => {
    if (timer.scheduleType === 'countdown' && timer.status === 'running') {
      const r = await window.api.getTimerRemaining(timer.id)
      setRemaining(r)
      if (r <= 0) setDone(true)
    } else {
      setRemaining(timer.remainingSeconds)
    }
  }, [timer.id, timer.remainingSeconds, timer.status, timer.scheduleType])

  useEffect(() => {
    fetchRemaining()
  }, [fetchRemaining])

  useEffect(() => {
    if (timer.scheduleType === 'countdown' && timer.status === 'running') {
      tickRef.current = setInterval(fetchRemaining, 1000)
    }
    return () => {
      if (tickRef.current) clearInterval(tickRef.current)
    }
  }, [timer.status, timer.scheduleType, fetchRemaining])

  useEffect(() => {
    const unsub = window.api.onTimerDone((id) => {
      if (id === timer.id) {
        setDone(true)
        setRemaining(0)
      }
    })
    return unsub
  }, [timer.id])

  const handleStart = async () => {
    const updated = await window.api.startTimer(timer.id)
    if (updated) onUpdate(updated)
  }

  const handlePause = async () => {
    const updated = await window.api.pauseTimer(timer.id)
    if (updated) {
      setRemaining(updated.remainingSeconds)
      onUpdate(updated)
    }
  }

  const handleStop = async () => {
    const updated = await window.api.stopTimer(timer.id)
    if (updated) {
      setRemaining(updated.remainingSeconds)
      setDone(false)
      onUpdate(updated)
    }
  }

  const handleAddSubtask = () => {
    if (subtaskInput.trim()) {
      onAddSubtask(timer.id, subtaskInput.trim())
      setSubtaskInput('')
    }
  }

  const isCountdown = timer.scheduleType === 'countdown'
  const totalSeconds = timer.durationMinutes * 60
  const progress = totalSeconds > 0 ? 1 - remaining / totalSeconds : 0
  const minutes = Math.floor(remaining / 60)
  const seconds = remaining % 60
  const circumference = 2 * Math.PI * 120
  const offset = circumference * (1 - progress)

  const completedSubtasks = timer.subtasks.filter((s) => s.completed).length

  return (
    <div className="pomodoro-page">
      <div className="pomodoro-header">
        <button className="back-btn" onClick={onBack}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          返回
        </button>
        <h2 className="pomodoro-title">{timer.title}</h2>
        <span className="pomodoro-count">已完成 {timer.completedCount} 次</span>
      </div>

      {isCountdown ? (
        <>
          <div className="pomodoro-ring-container">
            <svg className="pomodoro-ring" viewBox="0 0 260 260">
              <circle className="ring-bg" cx="130" cy="130" r="120" fill="none" stroke="var(--bg-tertiary)" strokeWidth="8" />
              <circle
                className="ring-progress"
                cx="130" cy="130" r="120"
                fill="none"
                stroke={done ? 'var(--success)' : 'var(--accent)'}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                transform="rotate(-90 130 130)"
              />
            </svg>
            <div className="pomodoro-time-display">
              {done ? (
                <div className="done-text">完成!</div>
              ) : (
                <div className="time-text">
                  {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                </div>
              )}
              <div className="time-label">
                {timer.status === 'running' ? '专注中' : timer.status === 'paused' ? '已暂停' : done ? '已结束' : '准备开始'}
              </div>
            </div>
          </div>

          <div className="pomodoro-controls">
            {timer.status === 'pending' && !done && (
              <button className="pomo-btn start" onClick={handleStart}>开始专注</button>
            )}
            {timer.status === 'running' && (
              <button className="pomo-btn pause" onClick={handlePause}>暂停</button>
            )}
            {timer.status === 'paused' && (
              <>
                <button className="pomo-btn start" onClick={handleStart}>继续</button>
                <button className="pomo-btn stop" onClick={handleStop}>重置</button>
              </>
            )}
            {done && (
              <button className="pomo-btn start" onClick={handleStop}>再来一次</button>
            )}
            {(timer.status === 'running' || timer.status === 'paused') && (
              <button className="pomo-btn stop" onClick={handleStop}>重置</button>
            )}
          </div>
        </>
      ) : (
        <div className="schedule-info">
          <div className="schedule-type-label">
            {timer.scheduleType === 'fixed' ? '固定日期提醒' : '每周重复提醒'}
          </div>
          <div className="schedule-detail">
            {timer.scheduleType === 'fixed' && timer.fixedDate && (
              <span>{new Date(timer.fixedDate).toLocaleString('zh-CN')}</span>
            )}
            {timer.scheduleType === 'recurring' && (
              <span>每周{timer.recurringDays.map((d) => ['日','一','二','三','四','五','六'][d]).join('、')} {timer.recurringTime}</span>
            )}
          </div>
          <div className="time-label" style={{ marginTop: 12 }}>
            {timer.status === 'done' ? '已提醒' : '等待提醒'}
          </div>
        </div>
      )}

      {/* Subtasks */}
      <div className="pomodoro-subtasks">
        <button className="subtask-toggle-pomo" onClick={() => setShowSubtasks(!showSubtasks)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points={showSubtasks ? "18 15 12 9 6 15" : "6 9 12 15 18 9"} />
          </svg>
          子任务 {completedSubtasks}/{timer.subtasks.length}
        </button>

        {showSubtasks && (
          <div className="pomo-subtask-list">
            {timer.subtasks.map((sub) => (
              <div key={sub.id} className={`subtask-item ${sub.completed ? 'completed' : ''}`}>
                <button
                  className={`subtask-checkbox ${sub.completed ? 'checked' : ''}`}
                  onClick={() => onToggleSubtask(timer.id, sub.id)}
                >
                  {sub.completed && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
                <span className="subtask-content">{sub.content}</span>
                <button className="subtask-delete" onClick={() => onDeleteSubtask(timer.id, sub.id)}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ))}
            <div className="subtask-add-row">
              <input
                className="subtask-input"
                type="text"
                value={subtaskInput}
                onChange={(e) => setSubtaskInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
                placeholder="添加子任务..."
              />
              <button className="subtask-add-btn" onClick={handleAddSubtask} disabled={!subtaskInput.trim()}>
                添加
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PomodoroTimer
