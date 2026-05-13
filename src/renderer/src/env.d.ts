/// <reference types="vite/client" />
import type { Todo, AIConfig, Timer, SubTask, LinkedDoc } from '../../../shared/types'

declare global {
  interface Window {
    api: {
      getTodos(): Promise<Todo[]>
      addTodo(content: string): Promise<Todo>
      updateTodo(id: string, updates: Record<string, unknown>): Promise<Todo | null>
      deleteTodo(id: string): Promise<void>
      toggleTodo(id: string): Promise<Todo | null>
      addSubtask(todoId: string, content: string, linkedTaskId?: string): Promise<Todo | null>
      toggleSubtask(todoId: string, subtaskId: string): Promise<Todo | null>
      deleteSubtask(todoId: string, subtaskId: string): Promise<Todo | null>
      autoCompleteTodo(todoId: string): Promise<Todo | null>
      aiComplete(prompt: string): Promise<{ text?: string; error?: string }>
      getAIConfig(): Promise<AIConfig>
      saveAIConfig(config: Record<string, string>): Promise<AIConfig>
      getTimers(): Promise<Timer[]>
      addTimer(title: string, scheduleType: string, durationMinutes: number, fixedDate: number | null, recurringDays: number[], recurringTime: string): Promise<Timer>
      startTimer(id: string): Promise<Timer | null>
      pauseTimer(id: string): Promise<Timer | null>
      stopTimer(id: string): Promise<Timer | null>
      deleteTimer(id: string): Promise<void>
      getTimerRemaining(id: string): Promise<number>
      addTimerSubtask(timerId: string, content: string, linkedTaskId?: string): Promise<Timer | null>
      toggleTimerSubtask(timerId: string, subtaskId: string): Promise<Timer | null>
      deleteTimerSubtask(timerId: string, subtaskId: string): Promise<Timer | null>
      onTimerDone(callback: (id: string) => void): () => void
      onTimerRemind(callback: (id: string) => void): () => void
      onWindowShake(callback: () => void): () => void
      getAutoStart(): Promise<boolean>
      setAutoStart(enabled: boolean): Promise<boolean>
      getAIAutoComplete(): Promise<boolean>
      setAIAutoComplete(enabled: boolean): Promise<boolean>
      getDocStoragePath(): Promise<string>
      setDocStoragePath(path: string): Promise<string>
      selectDocStoragePath(): Promise<string | null>
      createDoc(parentId: string, parentType: 'todo' | 'subtask', content?: string, fileName?: string): Promise<LinkedDoc | null>
      importDoc(parentId: string, parentType: 'todo' | 'subtask'): Promise<LinkedDoc | null>
      readDoc(filePath: string): Promise<{ content?: string; error?: string; exists: boolean }>
      writeDoc(filePath: string, content: string): Promise<{ error?: string; success?: boolean }>
      checkDocExists(filePath: string): Promise<boolean>
      deleteDoc(filePath: string): Promise<void>
      summarizeDoc(filePath: string): Promise<{ summary?: string; error?: string }>
      openDocInExplorer(filePath: string): Promise<void>
      openDocFile(filePath: string): Promise<void>
      clearAllData(): Promise<boolean>
    }
  }
}
