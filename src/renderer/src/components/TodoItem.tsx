import { useState, useRef, useEffect } from 'react'
import type { Todo } from '../types'
import '../styles/TodoItem.css'

interface TodoItemProps {
  todo: Todo
  allTodos: Todo[]
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onUpdate: (id: string, updates: Record<string, unknown>) => void
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

  // Docs state
  const [showDocs, setShowDocs] = useState(false)
  const [docExists, setDocExists] = useState(true)
  const [docSummary, setDocSummary] = useState(todo.linkedDoc?.summary || '')
  const [loadingSummary, setLoadingSummary] = useState(false)
  const [showNewDocInput, setShowNewDocInput] = useState(false)
  const [newDocName, setNewDocName] = useState('')
  const newDocNameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing && editRef.current) {
      editRef.current.focus()
      editRef.current.select()
    }
  }, [editing])

  useEffect(() => {
    if (todo.linkedDoc) {
      checkDocExists()
    }
  }, [todo.linkedDoc?.filePath])

  useEffect(() => {
    if (showNewDocInput && newDocNameRef.current) {
      newDocNameRef.current.focus()
      newDocNameRef.current.select()
    }
  }, [showNewDocInput])

  const checkDocExists = async () => {
    if (todo.linkedDoc) {
      const exists = await window.api.checkDocExists(todo.linkedDoc.filePath)
      setDocExists(exists)
    }
  }

  const handleOpenFile = async () => {
    if (todo.linkedDoc) {
      await window.api.openDocFile(todo.linkedDoc.filePath)
    }
  }

  const handleSaveEdit = () => {
    if (editValue.trim() && editValue.trim() !== todo.content) {
      onUpdate(todo.id, { content: editValue.trim() })
    }
    setEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit()
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

  const handleStartNewDoc = () => {
    setNewDocName('')
    setShowNewDocInput(true)
  }

  const handleConfirmNewDoc = async () => {
    const name = newDocName.trim() || 'untitled'
    const fileName = name.endsWith('.md') ? name : `${name}.md`
    const newDoc = await window.api.createDoc(todo.id, 'todo', undefined, fileName)
    if (newDoc) {
      await onUpdate(todo.id, { linkedDoc: newDoc })
      setShowDocs(true)
      setShowNewDocInput(false)
    }
  }

  const handleNewDocKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConfirmNewDoc()
    } else if (e.key === 'Escape') {
      setShowNewDocInput(false)
    }
  }

  const handleImportDoc = async () => {
    const newDoc = await window.api.importDoc(todo.id, 'todo')
    if (newDoc) {
      await onUpdate(todo.id, { linkedDoc: newDoc })
      setShowDocs(true)
    }
  }

  const handleOpenInExplorer = () => {
    if (todo.linkedDoc) {
      window.api.openDocInExplorer(todo.linkedDoc.filePath)
    }
  }

  const handleDeleteDoc = async () => {
    if (todo.linkedDoc) {
      await window.api.deleteDoc(todo.linkedDoc.filePath)
      await onUpdate(todo.id, { linkedDoc: null })
      setShowDocs(false)
      setDocSummary('')
    }
  }

  const handleSummarize = async () => {
    if (!todo.linkedDoc) return
    setLoadingSummary(true)
    try {
      const result = await window.api.summarizeDoc(todo.linkedDoc.filePath)
      if (result.summary) {
        setDocSummary(result.summary)
        onUpdate(todo.id, { linkedDoc: { ...todo.linkedDoc, summary: result.summary } })
      } else if (result.error) {
        alert(`总结失败: ${result.error}`)
      }
    } finally {
      setLoadingSummary(false)
    }
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
            onBlur={handleSaveEdit}
            onKeyDown={handleKeyDown}
          />
        ) : (
          <span className="todo-content" onDoubleClick={() => setEditing(true)}>
            {typeof todo.content === 'string' ? todo.content : ''}
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

        {todo.linkedDoc && (
          <button
            className={`doc-toggle ${showDocs ? 'active' : ''} ${!docExists ? 'doc-missing' : ''}`}
            onClick={() => setShowDocs(!showDocs)}
            title={showDocs ? '收起文档' : '展开文档'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </button>
        )}

        <div className="todo-actions">
          {!todo.linkedDoc && (
            <button className="todo-add-doc" onClick={handleStartNewDoc} title="新建文档">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="12" y1="11" x2="12" y2="17"/>
                <line x1="9" y1="14" x2="15" y2="14"/>
              </svg>
            </button>
          )}
          {!todo.linkedDoc && (
            <button className="todo-import-doc" onClick={handleImportDoc} title="导入文档">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </button>
          )}
          <button className="todo-subtask-add" onClick={() => setShowSubtasks(true)} title="添加子任务">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
          <button className="todo-delete" onClick={() => onDelete(todo.id)} title="删除">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>

      {showNewDocInput && (
        <div className="new-doc-row">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          <input
            ref={newDocNameRef}
            className="new-doc-input"
            type="text"
            value={newDocName}
            onChange={(e) => setNewDocName(e.target.value)}
            onKeyDown={handleNewDocKeyDown}
            placeholder="输入文档名称..."
          />
          <span className="new-doc-ext">.md</span>
          <button className="new-doc-confirm" onClick={handleConfirmNewDoc} disabled={!newDocName.trim()}>
            创建
          </button>
          <button className="new-doc-cancel" onClick={() => setShowNewDocInput(false)}>
            取消
          </button>
        </div>
      )}

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
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
              </button>
              <span className="subtask-content">
                {sub.content}
                {sub.linkedTaskId && <span className="linked-badge">已关联</span>}
              </span>
              <button className="subtask-delete" onClick={() => handleDeleteSubtask(sub.id)}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
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

      {showDocs && todo.linkedDoc && (
        <div className="doc-area">
          <div className="doc-header">
            <button className="doc-file-link" onClick={handleOpenFile} title="点击打开文件">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              <span>{todo.linkedDoc.fileName}</span>
            </button>
            <div className="doc-actions">
              <button onClick={handleSummarize} title="AI 总结" disabled={loadingSummary}>
                {loadingSummary ? (
                  <svg width="14" height="14" viewBox="0 0 50 50" fill="none">
                    <circle cx="25" cy="25" r="20" stroke="currentColor" strokeWidth="4" opacity="0.3"/>
                    <circle cx="25" cy="25" r="20" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeDasharray="80 80" strokeDashoffset="20"/>
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                  </svg>
                )}
              </button>
              <button onClick={handleOpenInExplorer} title="在文件夹中显示">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5l2-3h6l2 3h5a2 2 0 0 1 2 2v11z"/>
                  <circle cx="12" cy="13" r="3"/>
                </svg>
              </button>
              <button onClick={handleDeleteDoc} title="删除文档" className="doc-delete">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>

          {!docExists && (
            <div className="doc-missing-warning">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              文件不存在或已被移动
            </div>
          )}

          {docSummary && (
            <div className="doc-summary">
              <span className="summary-label">AI 总结</span>
              <p>{docSummary}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default TodoItem
