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
    <div className="w-full max-w-md mx-auto px-4">
      <h1 className="text-4xl font-bold text-[#e6edf3] text-center mb-3 tracking-tight">
        Notepad
      </h1>
      <p className="text-[15px] text-[#8b949e] text-center mb-8">
        프로젝트를 선택하고 비밀번호를 입력하세요
      </p>

      <div className="relative bg-[#161b22] border border-[#21262d] rounded-2xl p-8">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg text-[#8b949e] hover:text-[#e6edf3] hover:bg-white/5 transition-all duration-150"
          >
            <X size={16} />
          </button>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 프로젝트 드롭다운 */}
          <div>
            <label className="block text-[13px] font-medium text-[#8b949e] mb-2">프로젝트</label>
            <div className="relative">
              <select
                value={selectedProject?.id ?? ''}
                onChange={e => {
                  const p = projects.find(p => p.id === e.target.value) ?? null
                  setSelectedProject(p)
                  setError(null)
                }}
                required
                className="w-full appearance-none px-4 py-3.5 pr-10 bg-[#0d1117] border border-[#21262d] rounded-xl text-[15px] text-[#e6edf3] focus:outline-none focus:border-[#388bfd] transition-colors cursor-pointer"
              >
                <option value="" disabled className="text-[#484f58]">선택...</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id} className="bg-[#0d1117]">
                    {p.name}{p.is_master ? ' (마스터)' : ''}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8b949e] pointer-events-none" />
            </div>
          </div>

          {/* 비밀번호 */}
          <div>
            <label className="block text-[13px] font-medium text-[#8b949e] mb-2">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoFocus
              placeholder="비밀번호 입력"
              className="w-full px-4 py-3.5 bg-[#0d1117] border border-[#21262d] rounded-xl text-[15px] text-[#e6edf3] placeholder-[#484f58] focus:outline-none focus:border-[#388bfd] transition-colors"
            />
          </div>

          {error && (
            <p className="text-[13px] text-red-400 bg-red-400/10 px-4 py-2.5 rounded-lg">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !selectedProject}
            className="w-full py-3.5 bg-[#388bfd] hover:bg-[#1f6feb] disabled:opacity-40 disabled:cursor-not-allowed text-white text-[16px] font-semibold rounded-xl transition-colors mt-2"
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>
      </div>
    </div>
  )
}
