import { useState } from 'react'
import { X, ChevronDown } from 'lucide-react'

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
    <div className="w-full max-w-sm">
      <h1 className="text-2xl font-semibold text-[#e2e2e2] text-center mb-8">
        Notepad
      </h1>

      <div className="relative bg-[#16161a] border border-[#242428] rounded-xl p-8">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-md text-[#505060] hover:text-[#e2e2e2] hover:bg-white/5 transition-all duration-150"
          >
            <X size={14} />
          </button>
        )}

        <p className="text-[13px] text-[#606070] text-center mb-6">
          프로젝트를 선택하고 비밀번호를 입력하세요
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 프로젝트 드롭다운 */}
          <div>
            <label className="block text-xs text-[#606070] mb-1.5">프로젝트</label>
            <div className="relative">
              <select
                value={selectedProject?.id ?? ''}
                onChange={e => {
                  const p = projects.find(p => p.id === e.target.value) ?? null
                  setSelectedProject(p)
                  setError(null)
                }}
                required
                className="w-full appearance-none px-3 py-2 pr-8 bg-[#0f0f10] border border-[#242428] rounded-lg text-sm text-[#e2e2e2] focus:outline-none focus:border-[#7c6af5] transition-colors cursor-pointer"
              >
                <option value="" disabled className="text-[#404050]">선택...</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id} className="bg-[#0f0f10]">
                    {p.name}{p.is_master ? ' (마스터)' : ''}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#505060] pointer-events-none" />
            </div>
          </div>

          {/* 비밀번호 */}
          <div>
            <label className="block text-xs text-[#606070] mb-1.5">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoFocus
              placeholder="비밀번호 입력"
              className="w-full px-3 py-2 bg-[#0f0f10] border border-[#242428] rounded-lg text-sm text-[#e2e2e2] placeholder-[#404050] focus:outline-none focus:border-[#7c6af5] transition-colors"
            />
          </div>

          {error && (
            <p className="text-xs text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !selectedProject}
            className="w-full py-2 bg-[#7c6af5] hover:bg-[#6a59e0] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>
      </div>
    </div>
  )
}
