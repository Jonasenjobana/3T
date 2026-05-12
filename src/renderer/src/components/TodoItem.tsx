import { useState, useRef, useEffect } from 'react'
import type { Todo, SubTask } from '../types'
import '../styles/TodoItem.css'

interface TodoItemProps {
  todo: Todo
  allTodos: Todo[]
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onUpdate: (id: string, content: string) => void
  onAddSubtask: (todoId: string, content: string, linkedTaskId?: string) => void
  onToggleSubtask: (todoId: string, subtaskId: string) => void
  onDeleteSubtask: (todoId: string, subtaskId: string) => void
  onAutoComplete: (todoId: string) => void
}

function TodoItem({ todo, allTodos, onToggle, onDelete, onUpdate, onAddSubtask, onToggleSubtask, onDeleteSubtask, onAutoComplete }: TodoItemProps) {
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(todo.content)
  const [showSubtasks, setShowSubtasks] = useState(false)
  const [subtaskInput, setSubtaskInput] = useState('')
  const [showLinkPicker, setShowLinkPicker] = useState(false)
  const editRef = useRef<HTMLInputElement>(null)
  const subtaskInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing && editRef.current) {
      editRef.current.focus()
      editRef.current.select()
    }
  }, [editing])

  const handleSave = () => {
    if (editValue.trim() && editValue.trim() !== todo.content) {
      onUpdate(todo.id, editValue.trim())
    }
    setEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      setEditValue(todo.content)
      setEditing(false)
    }
  }

  const handleAddSubtask = () => {
    if (subtaskInput.trim()) {
      onAddSubtask(todo.id, subtaskInput.trim())
      setSubtaskInput('')
    }
  }

  const handleSubtaskKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddSubtask()
    }
  }

  const handleToggleSubtask = (subtaskId: string) => {
    onToggleSubtask(todo.id, subtaskId)
  }

  const handleDeleteSubtask = (subtaskId: string) => {
    onDeleteSubtask(todo.id, subtaskId)
  }

  const linkedSubtaskCount = todo.subtasks.filter((s) => s.linkedTaskId).length
  const completedSubtasks = todo.subtasks.filter((s) => s.completed).length
  const allSubDone = todo.subtasks.length > 0 && completedSubtasks === todo.subtasks.length
  const otherTodos = allTodos.filter((t) => t.id !== todo.id)

  return (
    <div className={`todo-item-wrapper ${todo.completed ? 'completed' : ''}`}>
      <div className="todo-item">
        <button
          className={`todo-checkbox ${todo.completed ? 'checked' : ''}`}
          onClick={() => {
            if (!todo.completed && todo.subtasks.length > 0 && !allSubDone) return
            onToggle(todo.id)
          }}
          title={todo.subtasks.length > 0 && !allSubDone && !todo.completed ? '子任务未全部完成' : ''}
        >
          {todo.completed && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </button>

        {editing ? (
          <input
            ref={editRef}
            className="todo-edit-input"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
          />
        ) : (
          <span className="todo-content" onDoubleClick={() => setEditing(true)}>
            {todo.content}
          </span>
        )}

        {todo.subtasks.length > 0 && (
          <button
            className={`subtask-toggle ${showSubtasks ? 'active' : ''}`}
            onClick={() => setShowSubtasks(!showSubtasks)}
            title={showSubtasks ? '收起子任务' : '展开子任务'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points={showSubtasks ? "18 15 12 9 6 15" : "6 9 12 15 18 9"} />
            </svg>
            <span className="subtask-badge">{completedSubtasks}/{todo.subtasks.length}</span>
          </button>
        )}

        <button className="todo-subtask-add" onClick={() => setShowSubtasks(true)} title="添加子任务">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>

        <button className="todo-delete" onClick={() => onDelete(todo.id)} title="删除">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {showSubtasks && (
        <div className="subtask-area">
          {todo.subtasks.map((sub) => (
            <div key={sub.id} className={`subtask-item ${sub.completed ? 'completed' : ''}`}>
              <button
                className={`subtask-checkbox ${sub.completed ? 'checked' : ''}`}
                onClick={() => handleToggleSubtask(sub.id)}
              >
                {sub.completed && (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
              <span className="subtask-content">
                {sub.content}
                {sub.linkedTaskId && <span className="linked-badge">已关联</span>}
              </span>
              <button className="subtask-delete" onClick={() => handleDeleteSubtask(sub.id)}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          ))}

          {allSubDone && !todo.completed && (
            <button className="auto-complete-btn" onClick={() => onAutoComplete(todo.id)}>
              所有子任务已完成，标记主任务完成
            </button>
          )}

          <div className="subtask-add-row">
            <input
              ref={subtaskInputRef}
              className="subtask-input"
              type="text"
              value={subtaskInput}
              onChange={(e) => setSubtaskInput(e.target.value)}
              onKeyDown={handleSubtaskKeyDown}
              placeholder="输入子任务..."
            />
            <button className="subtask-add-btn" onClick={handleAddSubtask} disabled={!subtaskInput.trim()}>
              添加
            </button>
            {otherTodos.length > 0 && (
              <button className="subtask-link-btn" onClick={() => setShowLinkPicker(!showLinkPicker)} title="关联已有任务">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                </svg>
              </button>
            )}
          </div>

          {showLinkPicker && (
            <div className="link-picker">
              <div className="link-picker-header">关联已有任务</div>
              {otherTodos.map((t) => (
                <button
                  key={t.id}
                  className="link-picker-item"
                  onClick={() => {
                    onAddSubtask(todo.id, t.content, t.id)
                    setShowLinkPicker(false)
                  }}
                >
                  {t.content}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default TodoItem
