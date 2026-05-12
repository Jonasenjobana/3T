import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/_variables.css'
import './styles/_base.css'
import './styles/_animations.css'
import './styles/_shared.css'
import './styles/App.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
