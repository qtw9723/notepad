import { useParams } from 'react-router-dom'
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
    document.body.style.overflow = 'auto'
    document.body.style.height = 'auto'
    return () => {
      document.body.style.overflow = ''
      document.body.style.height = ''
    }
  }, [])

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
      <div className="min-h-screen bg-[#09090e] flex items-center justify-center">
        <div className="animate-pulse text-[#484f58] text-sm">불러오는 중...</div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-[#09090e] flex items-center justify-center">
        <p className="text-[#484f58] text-sm">노트를 찾을 수 없습니다</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#09090e] py-20 px-6">
      <div className="max-w-[720px] mx-auto rounded-2xl border border-[#21262d] overflow-hidden shadow-2xl">
        {/* 헤더 */}
        <div className="px-12 pt-12 pb-8 border-b border-[#21262d] bg-[#0d1117]">
          <h1
            className="text-[2.2rem] font-bold text-[#e6edf3] leading-[1.2] mb-5"
            style={{ letterSpacing: '-0.03em' }}
          >
            {note.title || <span className="text-[#21262d]">제목 없음</span>}
          </h1>
          {note.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {note.tags.map(tag => (
                <span
                  key={tag}
                  className="text-xs px-2.5 py-1 rounded-full bg-[#21262d] text-[#8b949e]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 본문 */}
        <div className="px-12 py-12 bg-[#0d1117]">
          {note.content_type === 'markdown' ? (
            <div className="markdown-body text-[#cdd9e5] text-[1rem]">
              {note.content
                ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{note.content}</ReactMarkdown>
                : <p className="text-[#484f58] italic text-sm">내용이 없습니다</p>
              }
            </div>
          ) : note.content_type === 'html' ? (
            <div
              className="text-[#cdd9e5] text-[1rem] leading-[1.9]"
              dangerouslySetInnerHTML={{ __html: note.content || '' }}
            />
          ) : (
            <p className="text-[#cdd9e5] text-[1rem] leading-[1.9] whitespace-pre-wrap">
              {note.content}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
