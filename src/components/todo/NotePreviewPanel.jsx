import { useEffect } from 'react'
import { X, ExternalLink } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export function NotePreviewPanel({ note, onClose }) {
  const navigate = useNavigate()

  // ESC 키로 닫기
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const isMarkdown = note.content_type === 'markdown'
  const isHtml = note.content_type === 'html'

  return (
    <>
      {/* backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: 'rgba(0,0,0,0.3)' }}
        onClick={onClose}
      />

      {/* panel */}
      <div
        className="fixed right-0 top-0 bottom-0 z-50 flex flex-col"
        style={{
          width: 'min(480px, 90vw)',
          background: '#0d1117',
          borderLeft: '1px solid #21262d',
          boxShadow: '-8px 0 32px rgba(0,0,0,0.4)',
          animation: 'slideInRight 0.2s ease',
        }}
      >
        {/* header */}
        <div
          className="flex items-start justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid #21262d' }}
        >
          <h2
            className="flex-1 pr-3 text-[16px] font-semibold leading-snug"
            style={{ color: '#e6edf3', letterSpacing: '-0.01em' }}
          >
            {note.title || '제목 없음'}
          </h2>
          <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
            <button
              onClick={() => { onClose(); navigate(`/?note=${note.id}`) }}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] transition-colors hover:opacity-80"
              style={{ color: '#8b949e', background: '#161b22' }}
              title="노트패드에서 열기"
            >
              <ExternalLink size={12} />
              열기
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg transition-colors hover:bg-white/5"
              style={{ color: '#606070' }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {!note.content ? (
            <p style={{ color: '#484f58' }} className="text-[13px]">내용 없음</p>
          ) : isMarkdown ? (
            <div className="markdown-body" style={{ fontSize: '14px' }}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {note.content}
              </ReactMarkdown>
            </div>
          ) : isHtml ? (
            <div
              className="markdown-body"
              style={{ fontSize: '14px' }}
              dangerouslySetInnerHTML={{ __html: note.content }}
            />
          ) : (
            <pre
              className="whitespace-pre-wrap text-[13px] leading-relaxed"
              style={{ color: '#cdd9e5', fontFamily: 'inherit' }}
            >
              {note.content}
            </pre>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </>
  )
}
