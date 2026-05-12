import { useState, useRef, useCallback, useEffect } from 'react'
import type { AIConfig } from '../types'
import '../styles/AIInput.css'

interface AIInputProps {
  onAdd: (content: string) => void
  aiConfig: AIConfig
}

function AIInput({ onAdd, aiConfig }: AIInputProps) {
  const [input, setInput] = useState('')
  const [suggestion, setSuggestion] = useState('')
  const [displayedSuggestion, setDisplayedSuggestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()
  const typingRef = useRef<ReturnType<typeof setInterval>>()

  const stopTyping = useCallback(() => {
    if (typingRef.current) {
      clearInterval(typingRef.current)
      typingRef.current = undefined
    }
  }, [])

  const startTyping = useCallback((text: string) => {
    stopTyping()
    setDisplayedSuggestion('')
    let i = 0
    typingRef.current = setInterval(() => {
      if (i < text.length) {
        setDisplayedSuggestion(text.slice(0, i + 1))
        i++
      } else {
        stopTyping()
      }
    }, 35)
  }, [stopTyping])

  const fetchSuggestion = useCallback(
    async (text: string) => {
      if (!text.trim() || !aiConfig.apiKey) {
        setSuggestion('')
        setDisplayedSuggestion('')
        stopTyping()
        return
      }

      setLoading(true)
      setError('')
      try {
        const result = await window.api.aiComplete(text)
        if (result.error) {
          setError(result.error)
          setSuggestion('')
          setDisplayedSuggestion('')
          stopTyping()
        } else if (result.text) {
          setSuggestion(result.text)
          startTyping(result.text)
        }
      } catch {
        setSuggestion('')
        setDisplayedSuggestion('')
        stopTyping()
      } finally {
        setLoading(false)
      }
    },
    [aiConfig.apiKey, startTyping, stopTyping]
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInput(value)
    setSuggestion('')
    setDisplayedSuggestion('')
    setError('')
    stopTyping()

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    if (value.trim()) {
      debounceRef.current = setTimeout(() => fetchSuggestion(value), 800)
    }
  }

  const acceptSuggestion = () => {
    const text = suggestion || displayedSuggestion
    if (text) {
      setInput((prev) => prev + text)
      setSuggestion('')
      setDisplayedSuggestion('')
      stopTyping()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Tab' && (suggestion || displayedSuggestion)) {
      e.preventDefault()
      acceptSuggestion()
    } else if (e.key === 'Enter' && input.trim()) {
      e.preventDefault()
      onAdd(input.trim())
      setInput('')
      setSuggestion('')
      setDisplayedSuggestion('')
      stopTyping()
    } else if (e.key === 'Escape') {
      setSuggestion('')
      setDisplayedSuggestion('')
      stopTyping()
    }
  }

  const handleAdd = () => {
    if (input.trim()) {
      onAdd(input.trim())
      setInput('')
      setSuggestion('')
      setDisplayedSuggestion('')
      stopTyping()
    }
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      stopTyping()
    }
  }, [stopTyping])

  const hasSuggestion = suggestion || displayedSuggestion

  return (
    <div className="ai-input-container">
      <div className="ai-input-row">
        <div className="ai-input-wrapper">
          <input
            className="ai-input"
            type="text"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={aiConfig.apiKey ? '添加新任务... (AI 将自动补全)' : '添加新任务... (请在设置中配置 AI)'}
            spellCheck={false}
          />
          {loading && (
            <div className="ai-loading-indicator">
              <div className="ai-dot" />
              <div className="ai-dot" />
              <div className="ai-dot" />
            </div>
          )}
        </div>
        <button className="add-btn" onClick={handleAdd} disabled={!input.trim()}>
          添加
        </button>
      </div>
      {loading && (
        <div className="ai-status">
          <span className="ai-status-icon">✦</span> AI 正在生成建议...
        </div>
      )}
      {hasSuggestion && !loading && (
        <div className="ai-suggestion" onClick={acceptSuggestion}>
          <span className="suggestion-icon">✦</span>
          <span className="suggestion-text">{displayedSuggestion || suggestion}<span className="suggestion-cursor">|</span></span>
          <kbd className="suggestion-key">Tab 接受</kbd>
        </div>
      )}
      {error && <div className="ai-error">{error}</div>}
    </div>
  )
}

export default AIInput
