import type { Todo } from '../types'
import TodoItem from './TodoItem'
import '../styles/TodoList.css'

interface TodoListProps {
  todos: Todo[]
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onUpdate: (id: string, updates: Record<string, unknown>) => void
  onAddSubtask: (todoId: string, content: string, linkedTaskId?: string) => void
  onToggleSubtask: (todoId: string, subtaskId: string) => void
  onDeleteSubtask: (todoId: string, subtaskId: string) => void
  onAutoComplete: (todoId: string) => void
}

function TodoList({ todos, onToggle, onDelete, onUpdate, onAddSubtask, onToggleSubtask, onDeleteSubtask, onAutoComplete }: TodoListProps) {
  const activeTodos = todos.filter((t) => !t.completed)
  const completedTodos = todos.filter((t) => t.completed)

  if (todos.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📋</div>
        <p>暂无任务</p>
        <p className="empty-hint">在上方输入框添加新任务</p>
      </div>
    )
  }

  return (
    <div className="todo-list">
      {activeTodos.length > 0 && (
        <div className="todo-section">
          {completedTodos.length > 0 && <h3 className="section-title">进行中 ({activeTodos.length})</h3>}
          {activeTodos.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              allTodos={todos}
              onToggle={onToggle}
              onDelete={onDelete}
              onUpdate={onUpdate}
              onAddSubtask={onAddSubtask}
              onToggleSubtask={onToggleSubtask}
              onDeleteSubtask={onDeleteSubtask}
              onAutoComplete={onAutoComplete}
            />
          ))}
        </div>
      )}

      {completedTodos.length > 0 && (
        <div className="todo-section completed-section">
          <h3 className="section-title">已完成 ({completedTodos.length})</h3>
          {completedTodos.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              allTodos={todos}
              onToggle={onToggle}
              onDelete={onDelete}
              onUpdate={onUpdate}
              onAddSubtask={onAddSubtask}
              onToggleSubtask={onToggleSubtask}
              onDeleteSubtask={onDeleteSubtask}
              onAutoComplete={onAutoComplete}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default TodoList
