import { useState, useEffect } from 'react'
import type { AIConfig } from '../types'
import '../styles/Settings.css'

interface SettingsProps {
  config: AIConfig
  onSave: (config: AIConfig) => void
  onClose: () => void
}

function Settings({ config, onSave, onClose }: SettingsProps) {
  const [apiKey, setApiKey] = useState(config.apiKey)
  const [apiBase, setApiBase] = useState(config.apiBase)
  const [modelName, setModelName] = useState(config.modelName)
  const [showKey, setShowKey] = useState(false)
  const [autoStart, setAutoStart] = useState(false)

  useEffect(() => {
    window.api.getAutoStart().then(setAutoStart).catch(() => {})
  }, [])

  const handleAutoStartToggle = async () => {
    const next = !autoStart
    setAutoStart(next)
    await window.api.setAutoStart(next)
  }

  const handleSave = () => {
    onSave({
      apiKey: apiKey.trim(),
      apiBase: apiBase.trim(),
      modelName: modelName.trim()
    })
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="settings-modal">
        <div className="modal-header">
          <h2>设置</h2>
          <button className="modal-close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="settings-section-title">通用</div>

        <div className="form-group">
          <div className="toggle-row" onClick={handleAutoStartToggle}>
            <div>
              <label>开机自启动</label>
              <span className="form-hint">系统启动时自动运行 Note Task</span>
            </div>
            <div className={`toggle-switch ${autoStart ? 'on' : ''}`}>
              <div className="toggle-knob" />
            </div>
          </div>
        </div>

        <div className="settings-section-title">AI 配置</div>

        <div className="form-group">
          <label>API Key</label>
          <div className="input-with-toggle">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="输入你的 API Key"
            />
            <button className="toggle-visibility" onClick={() => setShowKey(!showKey)}>
              {showKey ? '隐藏' : '显示'}
            </button>
          </div>
        </div>

        <div className="form-group">
          <label>API 地址</label>
          <input
            type="text"
            value={apiBase}
            onChange={(e) => setApiBase(e.target.value)}
            placeholder="https://api.openai.com/v1"
          />
          <span className="form-hint">支持 OpenAI 兼容的 API 地址（如国内中转、本地 Ollama 等）</span>
        </div>

        <div className="form-group">
          <label>模型名称</label>
          <input
            type="text"
            value={modelName}
            onChange={(e) => setModelName(e.target.value)}
            placeholder="gpt-3.5-turbo"
          />
          <span className="form-hint">例如: gpt-4o、deepseek-chat、qwen-turbo 等</span>
        </div>

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>
            取消
          </button>
          <button className="btn-primary" onClick={handleSave}>
            保存
          </button>
        </div>
      </div>
    </div>
  )
}

export default Settings
