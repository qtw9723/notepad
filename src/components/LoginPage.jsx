import { useState } from 'react'
import { X } from 'lucide-react'

export default function LoginPage({ onSignIn, onSignUp, onClose }) {
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)
    try {
      if (mode === 'login') {
        await onSignIn(email, password)
      } else {
        await onSignUp(email, password)
        setMessage('가입 확인 이메일을 보냈습니다. 메일을 확인해 주세요.')
      }
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
          <div className="flex mb-6 bg-[#0f0f10] rounded-lg p-1">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(null); setMessage(null) }}
              className={`flex-1 py-1.5 text-sm rounded-md transition-colors ${
                mode === 'login'
                  ? 'bg-[#7c6af5] text-white'
                  : 'text-[#606070] hover:text-[#e2e2e2]'
              }`}
            >
              로그인
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setError(null); setMessage(null) }}
              className={`flex-1 py-1.5 text-sm rounded-md transition-colors ${
                mode === 'signup'
                  ? 'bg-[#7c6af5] text-white'
                  : 'text-[#606070] hover:text-[#e2e2e2]'
              }`}
            >
              회원가입
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-[#606070] mb-1.5">이메일</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
                placeholder="example@email.com"
                className="w-full px-3 py-2 bg-[#0f0f10] border border-[#242428] rounded-lg text-sm text-[#e2e2e2] placeholder-[#404050] focus:outline-none focus:border-[#7c6af5] transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-[#606070] mb-1.5">비밀번호</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="6자 이상"
                className="w-full px-3 py-2 bg-[#0f0f10] border border-[#242428] rounded-lg text-sm text-[#e2e2e2] placeholder-[#404050] focus:outline-none focus:border-[#7c6af5] transition-colors"
              />
            </div>

            {error && (
              <p className="text-xs text-red-400">{error}</p>
            )}
            {message && (
              <p className="text-xs text-green-400">{message}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-[#7c6af5] hover:bg-[#6a59e0] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
            >
              {loading ? '처리 중...' : mode === 'login' ? '로그인' : '회원가입'}
            </button>
          </form>
        </div>
    </div>
  )
}

