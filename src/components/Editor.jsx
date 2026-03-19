import { useState, useEffect, useCallback, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { FileText, Code, FileCode2 } from 'lucide-react'
import TagInput from './TagInput'
import { api } from '../lib/api'

const CONTENT_TYPES = [
  { id: 'markdown', label: 'MD',   Icon: FileText },
  { id: 'html',     label: 'HTML', Icon: FileCode2 },
  { id: 'text',     label: 'Text', Icon: Code },
]

export default function Editor({ noteId, onUpdate }) {
  const [note, setNote] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const saveTimer = useRef(null)

  useEffect(() => {
    if (!noteId) return
    api.getNote(noteId).then(data => setNote(data))
  }, [noteId])

  const save = useCallback(async (updated) => {
    if (!updated?.id) return
    setSaving(true)
    const data = await api.updateNote(updated.id, {
      title: updated.title,
      content: updated.content,
      content_type: updated.content_type,
      tags: updated.tags,
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
    if (data) onUpdate(data)
  }, [onUpdate])

  const change = (field, value) => {
    setNote(prev => {
      const next = { ...prev, [field]: value }
      clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => save(next), 800)
      return next
    })
  }

  if (!noteId) {
    return (
      <div className="flex-1 flex items-center justify-center text-[#353545]">
        <div className="text-center select-none">
          <FileText size={40} className="mx-auto mb-3 opacity-20" />
          <p className="text-[13px]">메모를 선택하거나 새로 만드세요</p>
        </div>
      </div>
    )
  }

  if (!note) {
    return (
      <div className="flex-1 flex items-center justify-center text-[#353545]">
        <div className="animate-pulse text-[13px]">불러오는 중...</div>
      </div>
    )
  }

  const isSplit = note.content_type !== 'text'

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* 툴바 */}
      <div className="flex items-center gap-2 px-6 py-2.5 border-b border-[#1f1f24] shrink-0">
        <div className="flex bg-[#1a1a22] rounded-lg p-0.5 gap-0.5">
          {CONTENT_TYPES.map((ct) => (
            <button
              key={ct.id}
              onClick={() => change('content_type', ct.id)}
              className={`flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-md transition-all duration-150 ${
                note.content_type === ct.id
                  ? 'bg-[#7c6af5] text-white shadow-sm'
                  : 'text-[#505068] hover:text-[#9090b0]'
              }`}
            >
              <ct.Icon size={11} />
              {ct.label}
            </button>
          ))}
        </div>

        {isSplit && (
          <span className="text-[11px] text-[#353545] select-none">
            미리보기 자동
          </span>
        )}

        <div className="flex-1" />

        <span className={`text-[11px] transition-all duration-300 ${
          saved ? 'text-[#6ee7b7] opacity-100' : saving ? 'text-[#505068] opacity-100' : 'opacity-0'
        }`}>
          {saved ? '저장됨' : '저장 중...'}
        </span>
      </div>

      {isSplit ? (
        /* ── 분할 레이아웃 (markdown / html) ── */
        <div className="flex-1 flex overflow-hidden">

          {/* 왼쪽: 편집 */}
          <div className="flex-1 flex flex-col overflow-hidden border-r border-[#1f1f24]">
            <HeaderArea note={note} change={change} />
            <textarea
              value={note.content}
              onChange={e => change('content', e.target.value)}
              placeholder={
                note.content_type === 'markdown'
                  ? '# 제목\n\n내용을 입력하세요...'
                  : '<h1>제목</h1>\n<p>내용을 입력하세요...</p>'
              }
              className="flex-1 w-full px-10 pb-10 bg-transparent text-[#c0c0d0] text-[0.95rem] leading-[1.8] resize-none outline-none placeholder-[#2a2a3a] font-mono"
              spellCheck={false}
            />
          </div>

          {/* 오른쪽: 미리보기 */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-10 py-10">
              {/* 제목 미리보기 */}
              <h1
                className="text-[2rem] font-bold text-white leading-tight mb-4 tracking-tight"
                style={{ letterSpacing: '-0.02em' }}
              >
                {note.title || <span className="text-[#2a2a3a]">제목 없음</span>}
              </h1>

              {/* 구분선 */}
              <div className="border-t border-[#1f1f24] mb-6" />

              {/* 내용 미리보기 */}
              {note.content_type === 'markdown' ? (
                <div className="markdown-body text-[#c0c0d0] text-[0.95rem]">
                  {note.content
                    ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{note.content}</ReactMarkdown>
                    : <p className="text-[#353545] italic text-sm">내용을 입력하면 여기에 표시됩니다</p>
                  }
                </div>
              ) : (
                <div
                  className="text-[#c0c0d0] text-[0.95rem] leading-[1.8]"
                  dangerouslySetInnerHTML={{
                    __html: note.content || '<p style="color:#353545;font-style:italic;font-size:0.875rem">내용을 입력하면 여기에 표시됩니다</p>'
                  }}
                />
              )}
            </div>
          </div>
        </div>

      ) : (
        /* ── 단일 레이아웃 (text) ── */
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto w-full px-16 py-10">
            <HeaderArea note={note} change={change} />
            <textarea
              value={note.content}
              onChange={e => change('content', e.target.value)}
              placeholder="내용을 입력하세요..."
              className="w-full bg-transparent text-[#c0c0d0] text-[0.95rem] leading-[1.8] resize-none outline-none placeholder-[#2a2a3a]"
              style={{ minHeight: 'calc(100vh - 320px)' }}
              spellCheck={false}
            />
          </div>
        </div>
      )}
    </div>
  )
}

/* 제목 + 태그 영역 (두 레이아웃에서 공용) */
function HeaderArea({ note, change }) {
  return (
    <div className="px-10 pt-10 pb-4 shrink-0">
      <input
        value={note.title}
        onChange={e => change('title', e.target.value)}
        placeholder="제목 없음"
        className="w-full bg-transparent text-[2rem] font-bold text-white placeholder-[#2a2a3a] outline-none leading-tight mb-4 tracking-tight"
        style={{ letterSpacing: '-0.02em' }}
      />
      <TagInput
        tags={note.tags || []}
        onChange={tags => change('tags', tags)}
      />
      <div className="border-t border-[#1f1f24] mt-4" />
    </div>
  )
}
