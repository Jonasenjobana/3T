import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { app } from 'electron'
import type { Todo, AIConfig, Timer } from '../shared/types'

interface StoreData {
  todos: Todo[]
  aiConfig: AIConfig
  timers: Timer[]
  autoStart: boolean
  docStoragePath: string
  aiAutoComplete: boolean
}

const defaultData: StoreData = {
  todos: [],
  aiConfig: {
    apiKey: '',
    apiBase: 'https://api.openai.com/v1',
    modelName: 'gpt-3.5-turbo'
  },
  timers: [],
  autoStart: false,
  docStoragePath: '',
  aiAutoComplete: false
}

let storeData: StoreData = JSON.parse(JSON.stringify(defaultData))

function getStorePath(): string {
  return join(app.getPath('userData'), 'store.json')
}

function migrateData(data: Record<string, unknown>): StoreData {
  const result = { ...JSON.parse(JSON.stringify(defaultData)), ...data }
  if (Array.isArray(result.todos)) {
    result.todos = result.todos.map((todo: Record<string, unknown>) => ({
      ...todo,
      content: typeof todo.content === 'string' ? todo.content : String(todo.content || ''),
      subtasks: Array.isArray(todo.subtasks)
        ? (todo.subtasks as Record<string, unknown>[]).map((s) => ({
            ...s,
            content: typeof s.content === 'string' ? s.content : String(s.content || '')
          }))
        : []
    }))
  }
  if (Array.isArray(result.timers)) {
    result.timers = result.timers.map((timer: Record<string, unknown>) => ({
      ...timer,
      scheduleType: timer.scheduleType || 'countdown',
      fixedDate: timer.fixedDate ?? null,
      recurringDays: Array.isArray(timer.recurringDays) ? timer.recurringDays : [],
      recurringTime: timer.recurringTime || '09:00',
      subtasks: Array.isArray(timer.subtasks) ? timer.subtasks : []
    }))
  }
  result.autoStart = typeof result.autoStart === 'boolean' ? result.autoStart : false
  result.docStoragePath = result.docStoragePath || ''
  result.aiAutoComplete = typeof result.aiAutoComplete === 'boolean' ? result.aiAutoComplete : false
  return result as StoreData
}

export function loadStore(): void {
  try {
    const storePath = getStorePath()
    if (existsSync(storePath)) {
      const data = readFileSync(storePath, 'utf-8')
      storeData = migrateData(JSON.parse(data))
    }
  } catch (err) {
    console.error('Failed to load store:', err)
    storeData = JSON.parse(JSON.stringify(defaultData))
  }
}

export function saveStore(): void {
  try {
    const storePath = getStorePath()
    const dir = join(storePath, '..')
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }
    writeFileSync(storePath, JSON.stringify(storeData, null, 2), 'utf-8')
  } catch (err) {
    console.error('Failed to save store:', err)
  }
}

export function getStore(): StoreData {
  return storeData
}
