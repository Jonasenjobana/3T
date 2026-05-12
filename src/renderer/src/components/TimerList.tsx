import { useState } from 'react'
import type { Timer, TimerScheduleType } from '../types'
import '../styles/TimerList.css'

interface TimerListProps {
  timers: Timer[]
  onSelect: (timer: Timer) => void
  onAdd: (title: string, scheduleType: TimerScheduleType, durationMinutes: number, fixedDate: number | null, recurringDays: number[], recurringTime: string) => void
  onDelete: (id: string) => void
}

const PRESETS = [
  { label: '25 分钟', minutes: 25 },
  { label: '15 分钟', minutes: 15 },
  { label: '5 分钟', minutes: 5 },
  { label: '45 分钟', minutes: 45 }
]

const DAYS = ['日', '一', '二', '三', '四', '五', '六']

function TimerList({ timers, onSelect, onAdd, onDelete }: TimerListProps) {
  const [showAdd, setShowAdd] = useState(false)
  const [title, setTitle] = useState('')
  const [scheduleType, setScheduleType] = useState<TimerScheduleType>('countdown')
  const [minutes, setMinutes] = useState(25)
  const [useCustomTime, setUseCustomTime] = useState(false)
  const [customHours, setCustomHours] = useState(0)
  const [customMinutes, setCustomMinutes] = useState(0)
  const [fixedDate, setFixedDate] = useState('')
  const [fixedTime, setFixedTime] = useState('09:00')
  const [recurringDays, setRecurringDays] = useState<number[]>([])
  const [recurringTime, setRecurringTime] = useState('09:00')

  const handleAdd = () => {
    const duration = useCustomTime ? customHours * 60 + customMinutes : minutes
    if (scheduleType === 'countdown' && duration <= 0) return
    if (scheduleType === 'fixed' && !fixedDate) return
    if (scheduleType === 'recurring' && recurringDays.length === 0) return

    let parsedFixedDate: number | null = null
    if (scheduleType === 'fixed' && fixedDate) {
      parsedFixedDate = new Date(`${fixedDate}T${fixedTime}`).getTime()
    }

    onAdd(
      title.trim() || '专注时间',
      scheduleType,
      duration,
      parsedFixedDate,
      recurringDays,
      recurringTime
    )
    setTitle('')
    setShowAdd(false)
    setScheduleType('countdown')
    setUseCustomTime(false)
  }

  const toggleDay = (day: number) => {
    setRecurringDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    )
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  const statusLabel: Record<string, string> = {
    pending: '待开始',
    running: '进行中',
    paused: '已暂停',
    done: '已完成'
  }

  const statusColor: Record<string, string> = {
    pending: 'var(--text-muted)',
    running: 'var(--accent)',
    paused: '#e0af68',
    done: 'var(--success)'
  }

  const scheduleLabel: Record<string, string> = {
    countdown: '倒计时',
    fixed: '固定日期',
    recurring: '每周重复'
  }

  return (
    <div className="timer-list-page">
      <div className="timer-list-header">
        <h2>定时任务</h2>
        <button className="add-timer-btn" onClick={() => setShowAdd(!showAdd)}>
          {showAdd ? '取消' : '+ 新建'}
        </button>
      </div>

      {showAdd && (
        <div className="add-timer-form">
          <input
            className="timer-title-input"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="任务名称（如：写代码、阅读...）"
          />

          <div className="schedule-type-row">
            {(['countdown', 'fixed', 'recurring'] as TimerScheduleType[]).map((type) => (
              <button
                key={type}
                className={`preset-btn ${scheduleType === type ? 'active' : ''}`}
                onClick={() => setScheduleType(type)}
              >
                {scheduleLabel[type]}
              </button>
            ))}
          </div>

          {scheduleType === 'countdown' && (
            <div className="duration-options">
              {!useCustomTime ? (
                <div className="preset-row">
                  {PRESETS.map((p) => (
                    <button
                      key={p.minutes}
                      className={`preset-btn ${minutes === p.minutes ? 'active' : ''}`}
                      onClick={() => setMinutes(p.minutes)}
                    >
                      {p.label}
                    </button>
                  ))}
                  <button className="preset-btn" onClick={() => setUseCustomTime(true)}>
                    自定义
                  </button>
                </div>
              ) : (
                <div className="custom-time-row">
                  <div className="time-input-group">
                    <input type="number" min="0" max="23" value={customHours}
                      onChange={(e) => setCustomHours(Math.max(0, parseInt(e.target.value) || 0))} />
                    <span>时</span>
                    <input type="number" min="0" max="59" value={customMinutes}
                      onChange={(e) => setCustomMinutes(Math.max(0, parseInt(e.target.value) || 0))} />
                    <span>分</span>
                  </div>
                  <button className="preset-btn" onClick={() => setUseCustomTime(false)}>
                    快捷选择
                  </button>
                </div>
              )}
            </div>
          )}

          {scheduleType === 'fixed' && (
            <div className="fixed-date-row">
              <input type="date" value={fixedDate} onChange={(e) => setFixedDate(e.target.value)}
                className="date-input" />
              <input type="time" value={fixedTime} onChange={(e) => setFixedTime(e.target.value)}
                className="time-input" />
            </div>
          )}

          {scheduleType === 'recurring' && (
            <div className="recurring-options">
              <div className="day-picker">
                {DAYS.map((label, i) => (
                  <button
                    key={i}
                    className={`day-btn ${recurringDays.includes(i) ? 'active' : ''}`}
                    onClick={() => toggleDay(i)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="recurring-time-row">
                <span className="recurring-label">提醒时间</span>
                <input type="time" value={recurringTime} onChange={(e) => setRecurringTime(e.target.value)}
                  className="time-input" />
              </div>
            </div>
          )}

          <button className="btn-primary create-timer-btn" onClick={handleAdd}>
            创建定时任务
          </button>
        </div>
      )}

      {timers.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">⏱</div>
          <p>暂无定时任务</p>
          <p className="empty-hint">点击上方「+ 新建」创建番茄钟</p>
        </div>
      ) : (
        <div className="timer-items">
          {timers.map((t) => (
            <div key={t.id} className="timer-card" onClick={() => onSelect(t)}>
              <div className="timer-card-top">
                <span className="timer-card-title">{t.title}</span>
                <div className="timer-card-badges">
                  <span className="schedule-badge">{scheduleLabel[t.scheduleType] || '倒计时'}</span>
                  <span className="timer-card-status" style={{ color: statusColor[t.status] }}>
                    {statusLabel[t.status]}
                  </span>
                </div>
              </div>
              <div className="timer-card-bottom">
                <span className="timer-card-duration">
                  {t.scheduleType === 'countdown' && (t.status === 'running' ? formatTime(t.remainingSeconds) : `${t.durationMinutes} 分钟`)}
                  {t.scheduleType === 'fixed' && t.fixedDate && new Date(t.fixedDate).toLocaleString('zh-CN')}
                  {t.scheduleType === 'recurring' && `每周${t.recurringDays.map((d) => DAYS[d]).join(' ')} ${t.recurringTime}`}
                </span>
                <span className="timer-card-count">
                  {t.subtasks.length > 0 && `${t.subtasks.filter((s) => s.completed).length}/${t.subtasks.length} 子任务 `}
                  已完成 {t.completedCount} 次
                </span>
              </div>
              <button
                className="timer-card-delete"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(t.id)
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default TimerList
