import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import SharePage from './components/SharePage.jsx'
import { TodoPage } from './pages/TodoPage.jsx'
import { useAuth } from './hooks/useAuth.js'

function TodoRoute() {
  const { user } = useAuth()
  return <TodoPage user={user} />
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {})
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/share/:noteId" element={<SharePage />} />
        <Route path="/todos" element={<TodoRoute />} />
        <Route path="/*" element={<App />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
