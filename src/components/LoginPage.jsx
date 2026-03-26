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
    <div className="w-full max-w-md px-4">
      <h1 className="text-3xl font-semibold text-[#e2e2e2] text-center mb-8">
        Notepad
      </h1>

      <div className="relative bg-[#161b22] border border-[#21262d] rounded-2xl p-8">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-lg text-[#505060] hover:text-[#e2e2e2] hover:bg-white/5 transition-all duration-150"
          >
            <X size={16} />
          </button>
        )}

        <p className="text-[15px] text-[#606070] text-center mb-7">
          프로젝트를 선택하고 비밀번호를 입력하세요
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 프로젝트 드롭다운 */}
          <div>
            <label className="block text-[13px] text-[#707080] mb-2">프로젝트</label>
            <div className="relative">
              <select
                value={selectedProject?.id ?? ''}
                onChange={e => {
                  const p = projects.find(p => p.id === e.target.value) ?? null
                  setSelectedProject(p)
                  setError(null)
                }}
                required
                className="w-full appearance-none px-4 py-3 pr-10 bg-[#0d1117] border border-[#21262d] rounded-xl text-[15px] text-[#e2e2e2] focus:outline-none focus:border-[#388bfd] transition-colors cursor-pointer"
              >
                <option value="" disabled className="text-[#404050]">선택...</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id} className="bg-[#0d1117]">
                    {p.name}{p.is_master ? ' (마스터)' : ''}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#505060] pointer-events-none" />
            </div>
          </div>

          {/* 비밀번호 */}
          <div>
            <label className="block text-[13px] text-[#707080] mb-2">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoFocus
              placeholder="비밀번호 입력"
              className="w-full px-4 py-3 bg-[#0d1117] border border-[#21262d] rounded-xl text-[15px] text-[#e2e2e2] placeholder-[#404050] focus:outline-none focus:border-[#388bfd] transition-colors"
            />
          </div>

          {error && (
            <p className="text-[13px] text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !selectedProject}
            className="w-full py-3 bg-[#388bfd] hover:bg-[#1f6feb] disabled:opacity-40 disabled:cursor-not-allowed text-white text-[15px] font-medium rounded-xl transition-colors"
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>
      </div>
    </div>
  )
}
