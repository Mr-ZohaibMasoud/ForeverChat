import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import ChatApp from './ChatApp'
import Login from './Login'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* <Login /> */}
    {/* <ChatApp /> */}
    <App />
  </StrictMode>,
)
