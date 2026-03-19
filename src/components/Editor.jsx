import { useState, useEffect, useCallback, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Eye, EyeOff, FileText, Code, FileCode2 } from 'lucide-react'
import TagInput from './TagInput'
import { api } from '../lib/api'

const CONTENT_TYPES = [
  { id: 'markdown', label: 'Markdown', Icon: FileText },
  { id: 'html', label: 'HTML', Icon: FileCode2 },
  { id: 'text', label: 'Text', Icon: Code },
]

export default function Editor({ noteId, onUpdate }) {
  const [note, setNote] = useState(null)
  const [preview, setPreview] = useState(false)
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
      <div className="flex-1 flex items-center justify-center text-[#404050]">
        <div className="text-center">
          <FileText size={48} className="mx-auto mb-3 opacity-20" />
          <p className="text-sm">메모를 선택하거나 새로 만드세요</p>
        </div>
      </div>
    )
  }

  if (!note) {
    return (
      <div className="flex-1 flex items-center justify-center text-[#404050]">
        <div className="animate-pulse text-sm">불러오는 중...</div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* 툴바 */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-[#242428] bg-[#161618] shrink-0">
        {/* 컨텐츠 타입 */}
        <div className="flex bg-[#1e1e28] rounded-lg p-0.5 gap-0.5">
          {CONTENT_TYPES.map((ct) => (
            <button
              key={ct.id}
              onClick={() => change('content_type', ct.id)}
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md transition-colors ${
                note.content_type === ct.id
                  ? 'bg-[#7c6af5] text-white'
                  : 'text-[#606070] hover:text-[#9090b0]'
              }`}
            >
              <ct.Icon size={12} />
              {ct.label}
            </button>
          ))}
        </div>

        {/* 미리보기 (markdown/html만) */}
        {note.content_type !== 'text' && (
          <button
            onClick={() => setPreview(p => !p)}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              preview
                ? 'border-[#7c6af5]/50 bg-[#7c6af5]/10 text-[#a990ff]'
                : 'border-[#2a2a38] text-[#606070] hover:text-[#9090b0]'
            }`}
          >
            {preview ? <EyeOff size={13} /> : <Eye size={13} />}
            {preview ? '편집' : '미리보기'}
          </button>
        )}

        <div className="flex-1" />

        {/* 저장 상태 */}
        <span className={`text-xs transition-opacity ${saved ? 'text-[#a6e3a1] opacity-100' : saving ? 'text-[#606070] opacity-100' : 'opacity-0'}`}>
          {saved ? '저장됨' : '저장 중...'}
        </span>
      </div>

      {/* 제목 */}
      <div className="px-6 pt-5 pb-3 shrink-0">
        <input
          value={note.title}
          onChange={e => change('title', e.target.value)}
          placeholder="제목을 입력하세요..."
          className="w-full bg-transparent text-2xl font-bold text-white placeholder-[#303040] outline-none"
        />
      </div>

      {/* 태그 */}
      <div className="px-6 pb-3 shrink-0 border-b border-[#1e1e28]">
        <TagInput
          tags={note.tags || []}
          onChange={tags => change('tags', tags)}
        />
      </div>

      {/* 에디터 / 미리보기 */}
      <div className="flex-1 overflow-y-auto">
        {preview && note.content_type === 'markdown' ? (
          <div className="markdown-body px-6 py-5 text-[#c8c8d8] text-[0.925rem] leading-relaxed">
            {note.content
              ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{note.content}</ReactMarkdown>
              : <p className="text-[#404050] italic">내용이 없습니다</p>
            }
          </div>
        ) : preview && note.content_type === 'html' ? (
          <div
            className="px-6 py-5 text-[#c8c8d8]"
            dangerouslySetInnerHTML={{ __html: note.content }}
          />
        ) : (
          <textarea
            value={note.content}
            onChange={e => change('content', e.target.value)}
            placeholder={
              note.content_type === 'markdown'
                ? '# 제목\n\n내용을 마크다운으로 작성하세요...'
                : note.content_type === 'html'
                ? '<h1>제목</h1>\n<p>내용을 HTML로 작성하세요...</p>'
                : '내용을 입력하세요...'
            }
            className="w-full h-full px-6 py-5 bg-transparent text-[#c8c8d8] text-sm leading-relaxed resize-none outline-none placeholder-[#303040] font-mono"
            spellCheck={false}
          />
        )}
      </div>
    </div>
  )
}
