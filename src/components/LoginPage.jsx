import { useState } from 'react'
import { X, ChevronDown, PenLine } from 'lucide-react'

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
    <div className="w-full max-w-sm mx-auto px-4">
      {/* 글래스 카드 */}
      <div
        className="relative rounded-2xl p-8"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(157,143,252,0.2)',
          backdropFilter: 'blur(12px)',
        }}
      >
        {/* 닫기 버튼 */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-150"
            style={{ color: '#606070' }}
            onMouseEnter={e => {
              e.currentTarget.style.color = '#e2e2e2'
              e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = '#606070'
              e.currentTarget.style.background = 'transparent'
            }}
          >
            <X size={15} />
          </button>
        )}

        {/* 심볼 아이콘 */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center mb-5"
          style={{
            background: 'rgba(157,143,252,0.15)',
            border: '1px solid rgba(157,143,252,0.3)',
          }}
        >
          <PenLine size={18} color="#9d8ffc" />
        </div>

        {/* 타이틀 */}
        <h1
          className="text-3xl font-bold tracking-tight mb-1"
          style={{ color: '#f0f0f0' }}
        >
          Notepad
        </h1>
        <p className="text-sm mb-8" style={{ color: '#606070' }}>
          프로젝트를 선택하고 비밀번호를 입력하세요
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 프로젝트 드롭다운 */}
          <div>
            <label
              className="block mb-2 text-xs font-semibold uppercase tracking-wider"
              style={{ color: '#8b8890' }}
            >
              프로젝트
            </label>
            <div className="relative">
              <select
                value={selectedProject?.id ?? ''}
                onChange={e => {
                  const p = projects.find(p => p.id === e.target.value) ?? null
                  setSelectedProject(p)
                  setError(null)
                }}
                required
                className="w-full appearance-none px-4 py-3 rounded-xl text-[15px] transition-colors cursor-pointer focus:outline-none"
                style={{
                  background: '#0a0a0c',
                  border: '1px solid #2a2a38',
                  color: selectedProject ? '#e2e2e2' : '#484f58',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = '#9d8ffc' }}
                onBlur={e => { e.currentTarget.style.borderColor = '#2a2a38' }}
              >
                <option value="" disabled style={{ color: '#484f58', background: '#0a0a0c' }}>
                  선택...
                </option>
                {projects.map(p => (
                  <option key={p.id} value={p.id} style={{ background: '#0a0a0c' }}>
                    {p.name}{p.is_master ? ' (마스터)' : ''}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={15}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: '#606070' }}
              />
            </div>
          </div>

          {/* 비밀번호 */}
          <div>
            <label
              className="block mb-2 text-xs font-semibold uppercase tracking-wider"
              style={{ color: '#8b8890' }}
            >
              비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoFocus
              placeholder="비밀번호 입력"
              className="w-full px-4 py-3 rounded-xl text-[15px] transition-colors focus:outline-none"
              style={{
                background: '#0a0a0c',
                border: '1px solid #2a2a38',
                color: '#e2e2e2',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = '#9d8ffc' }}
              onBlur={e => { e.currentTarget.style.borderColor = '#2a2a38' }}
            />
          </div>

          {/* 에러 */}
          {error && (
            <p className="text-[13px] text-red-400 bg-red-400/10 px-4 py-2.5 rounded-lg">
              {error}
            </p>
          )}

          {/* 로그인 버튼 */}
          <button
            type="submit"
            disabled={loading || !selectedProject}
            className="w-full py-3 rounded-xl text-[15px] font-semibold transition-colors mt-1 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: '#9d8ffc', color: '#0d0d10' }}
            onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.background = '#b8aeff' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#9d8ffc' }}
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>
      </div>
    </div>
  )
}
