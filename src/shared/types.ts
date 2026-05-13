export interface LinkedDoc {
  id: string
  filePath: string
  fileName: string
  summary?: string
  createdAt: number
  updatedAt: number
}

export interface SubTask {
  id: string
  content: string
  completed: boolean
  linkedTaskId?: string
  linkedDoc?: LinkedDoc
}

export interface Todo {
  id: string
  content: string
  completed: boolean
  subtasks: SubTask[]
  linkedDoc?: LinkedDoc
  createdAt: number
  updatedAt: number
}

export interface AIConfig {
  apiKey: string
  apiBase: string
  modelName: string
}

export type TimerScheduleType = 'countdown' | 'fixed' | 'recurring'

export type TimerStatus = 'pending' | 'running' | 'paused' | 'done'

export interface Timer {
  id: string
  title: string
  scheduleType: TimerScheduleType
  durationMinutes: number
  fixedDate: number | null
  recurringDays: number[]
  recurringTime: string
  subtasks: SubTask[]
  status: TimerStatus
  startedAt: number | null
  pausedAt: number | null
  remainingSeconds: number
  completedCount: number
  createdAt: number
}
