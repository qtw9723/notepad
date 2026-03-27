import { useState } from 'react'
import { X, PenLine } from 'lucide-react'

export default function LoginPage({ projects, onSignIn, onClose }) {
  const [selectedProject, setSelectedProject] = useState(null)
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedProject) return
    setError(null)
    setLoading(true)
    try {
      await onSignIn(selectedProject.slug, password)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-wrapper">
      <div className="login-card">
        {onClose && (
          <button onClick={onClose} className="login-close">
            <X size={15} />
          </button>
        )}

        <div className="login-icon">
          <PenLine size={18} color="#9d8ffc" />
        </div>

        <h1 className="login-title">Notepad</h1>
        <p className="login-subtitle">프로젝트를 선택하고 비밀번호를 입력하세요</p>

        <form onSubmit={handleSubmit}>
          <div className="login-field">
            <label className="login-label">프로젝트</label>
            <div className="login-select-wrap">
              <select
                className="login-input"
                value={selectedProject?.id ?? ''}
                onChange={e => {
                  const p = projects.find(p => p.id === e.target.value) ?? null
                  setSelectedProject(p)
                  setError(null)
                }}
                required
              >
                <option value="" disabled>선택...</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}{p.is_master ? ' (마스터)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="login-field">
            <label className="login-label">비밀번호</label>
            <input
              className="login-input"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoFocus
              placeholder="비밀번호 입력"
            />
          </div>

          {error && <p className="login-error">{error}</p>}

          <button
            className="login-btn"
            type="submit"
            disabled={loading || !selectedProject}
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>
      </div>
    </div>
  )
}
