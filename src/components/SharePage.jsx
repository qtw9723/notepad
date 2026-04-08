import { useParams, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { api } from '../lib/api'

export default function SharePage() {
  const { noteId } = useParams()
  const [note, setNote] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    api.getNote(noteId)
      .then(data => {
        if (data) setNote(data)
        else setNotFound(true)
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [noteId])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="animate-pulse text-[#484f58] text-sm">불러오는 중...</div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#484f58] text-sm">노트를 찾을 수 없습니다</p>
          <Link to="/" className="text-[#7c6af5] text-sm mt-2 block hover:opacity-80">
            ← Notepad로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0d1117]">
      <header className="border-b border-[#21262d] bg-[#161b22]">
        <div className="max-w-[760px] mx-auto px-6 py-3">
          <Link to="/" className="text-[#7c6af5] text-sm font-medium hover:opacity-80 transition-opacity">
            ← Notepad
          </Link>
        </div>
      </header>
      <main className="max-w-[760px] mx-auto px-6 py-10">
        <h1
          className="text-[2.2rem] font-bold text-[#e6edf3] leading-tight mb-4"
          style={{ letterSpacing: '-0.02em' }}
        >
          {note.title || <span className="text-[#21262d]">제목 없음</span>}
        </h1>
        <div className="border-t border-[#21262d] mb-6" />
        {note.content_type === 'markdown' ? (
          <div className="markdown-body text-[#cdd9e5] text-[1rem]">
            {note.content
              ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{note.content}</ReactMarkdown>
              : <p className="text-[#484f58] italic text-sm">내용이 없습니다</p>
            }
          </div>
        ) : note.content_type === 'html' ? (
          <div
            className="text-[#cdd9e5] text-[1rem] leading-[2.0]"
            dangerouslySetInnerHTML={{ __html: note.content || '' }}
          />
        ) : (
          <p className="text-[#cdd9e5] text-[1rem] leading-[2.0] whitespace-pre-wrap">
            {note.content}
          </p>
        )}
      </main>
    </div>
  )
}
