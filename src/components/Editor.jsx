import { useState, useEffect, useCallback, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { FileText, Code, FileCode2, Pencil, ArrowLeft } from 'lucide-react'
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels'
import TagInput from './TagInput'
import { api } from '../lib/api'

const CONTENT_TYPES = [
  { id: 'markdown', label: 'MD',   Icon: FileText },
  { id: 'html',     label: 'HTML', Icon: FileCode2 },
  { id: 'text',     label: 'Text', Icon: Code },
]

// 프리뷰 DOM 요소의 스크롤 컨테이너 기준 offsetTop 계산
function getOffsetInContainer(el, container) {
  return el.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop
}

// data-line 속성을 붙이는 ReactMarkdown 커스텀 컴포넌트
function makeLineComponents() {
  const wrap = (Tag) => ({ node, children, ...props }) => (
    <Tag data-line={node?.position?.start?.line} {...props}>{children}</Tag>
  )
  return {
    h1: wrap('h1'), h2: wrap('h2'), h3: wrap('h3'),
    h4: wrap('h4'), h5: wrap('h5'), h6: wrap('h6'),
    p: wrap('p'), pre: wrap('pre'),
    ul: wrap('ul'), ol: wrap('ol'),
    blockquote: wrap('blockquote'),
  }
}
const MD_COMPONENTS = makeLineComponents()

export default function Editor({
  noteId, fetchNote, onUpdate, isLoggedIn = false,
  isMobile = false, mobileView = 'preview', onMobileViewChange,
}) {
  const [note, setNote] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const saveTimer = useRef(null)
  const textareaRef = useRef(null)
  const previewRef = useRef(null)

  useEffect(() => {
    if (!noteId) return
    fetchNote(noteId).then(data => setNote(data))
  }, [noteId, fetchNote])

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

  const canEdit = isLoggedIn || !note?.user_id

  const change = (field, value) => {
    if (!canEdit) return
    setNote(prev => {
      const next = { ...prev, [field]: value }
      clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => save(next), 800)
      return next
    })
  }

  // 스크롤 싱크 (양방향) — 무한 루프 방지 플래그
  const scrollingFrom = useRef(null)

  const handleEditorScroll = useCallback(() => {
    if (scrollingFrom.current === 'preview') return
    scrollingFrom.current = 'editor'
    const ta = textareaRef.current
    const pv = previewRef.current
    if (!ta || !pv) return

    const lineHeight = parseFloat(getComputedStyle(ta).lineHeight) || 32
    const topLine = Math.floor(ta.scrollTop / lineHeight) + 1  // 1-indexed, remark 기준

    const lineEls = Array.from(pv.querySelectorAll('[data-line]'))
    if (lineEls.length === 0) {
      // HTML/fallback: 비율 기반
      const ratio = (ta.scrollTop / (ta.scrollHeight - ta.clientHeight)) || 0
      pv.scrollTop = ratio * (pv.scrollHeight - pv.clientHeight)
    } else {
      // 현재 줄에 가장 가까운 data-line 요소 찾기
      let best = lineEls[0]
      let bestDiff = Infinity
      for (const el of lineEls) {
        const diff = Math.abs(parseInt(el.dataset.line, 10) - topLine)
        if (diff < bestDiff) { bestDiff = diff; best = el }
      }
      pv.scrollTop = getOffsetInContainer(best, pv) - pv.clientHeight * 0.15
    }
    requestAnimationFrame(() => { scrollingFrom.current = null })
  }, [])

  const handlePreviewScroll = useCallback(() => {
    if (scrollingFrom.current === 'editor') return
    scrollingFrom.current = 'preview'
    const ta = textareaRef.current
    const pv = previewRef.current
    if (!ta || !pv) return

    const lineEls = Array.from(pv.querySelectorAll('[data-line]'))
    if (lineEls.length === 0) {
      const ratio = (pv.scrollTop / (pv.scrollHeight - pv.clientHeight)) || 0
      ta.scrollTop = ratio * (ta.scrollHeight - ta.clientHeight)
    } else {
      // 뷰포트 상단에 가장 가까운 data-line 요소 찾기
      const viewTop = pv.scrollTop + pv.clientHeight * 0.15
      let best = lineEls[0]
      let bestDiff = Infinity
      for (const el of lineEls) {
        const diff = Math.abs(getOffsetInContainer(el, pv) - viewTop)
        if (diff < bestDiff) { bestDiff = diff; best = el }
      }
      const sourceLine = parseInt(best.dataset.line, 10) - 1  // 0-indexed
      const lineHeight = parseFloat(getComputedStyle(ta).lineHeight) || 32
      ta.scrollTop = sourceLine * lineHeight
    }
    requestAnimationFrame(() => { scrollingFrom.current = null })
  }, [])

  if (!noteId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0d1117]">
        <div className="text-center select-none">
          <p className="text-[2rem] font-bold text-[#21262d] tracking-tight">Notepad</p>
          <p className="text-[13px] text-[#484f58] mt-2">메모를 선택하거나 새로 만드세요</p>
        </div>
      </div>
    )
  }

  if (!note) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0d1117]">
        <div className="animate-pulse text-[13px] text-[#484f58]">불러오는 중...</div>
      </div>
    )
  }

  const isSplit = note.content_type !== 'text'

  // 모바일: preview 전용 뷰
  if (isMobile && mobileView === 'preview') {
    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-[#0d1117]">
        <div className="bg-[#161b22] border-b border-[#21262d] shrink-0">
          <div className="flex items-center gap-3 px-5 pt-5 pb-2">
            <button
              onClick={() => onMobileViewChange('list')}
              className="flex items-center gap-1.5 text-[16px] font-medium text-[#9d8ffc] active:opacity-60 transition-opacity"
            >
              <ArrowLeft size={20} /> 목록
            </button>
            <div className="flex-1" />
            {canEdit && (
              <button
                onClick={() => onMobileViewChange('edit')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#9d8ffc] text-[#0d0d10] text-[15px] font-semibold active:opacity-80 transition-opacity"
              >
                <Pencil size={15} /> 편집
              </button>
            )}
          </div>
          <div className="px-5 pb-5 pt-1">
            <p className="text-[22px] font-bold text-[#f0f0f0] leading-tight truncate" style={{ letterSpacing: '-0.02em' }}>
              {note.title || '제목 없음'}
            </p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[760px] mx-auto px-6 py-8">
            <h1 className="text-[1.8rem] font-bold text-[#e6edf3] leading-tight mb-4" style={{ letterSpacing: '-0.02em' }}>
              {note.title || <span className="text-[#21262d]">제목 없음</span>}
            </h1>
            <div className="border-t border-[#21262d] mb-6" />
            {note.content_type === 'markdown' ? (
              <div className="markdown-body text-[#cdd9e5] text-[1rem]">
                {note.content
                  ? <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD_COMPONENTS}>{note.content}</ReactMarkdown>
                  : <p className="text-[#484f58] italic text-sm">내용이 없습니다</p>
                }
              </div>
            ) : note.content_type === 'html' ? (
              <div className="text-[#cdd9e5] text-[1rem] leading-[2.0]"
                dangerouslySetInnerHTML={{ __html: note.content || '' }} />
            ) : (
              <p className="text-[#cdd9e5] text-[1rem] leading-[2.0] whitespace-pre-wrap">{note.content}</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  // 모바일: edit 전용 뷰
  if (isMobile && mobileView === 'edit') {
    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-[#0d1117]">
        {/* 상단 툴바 */}
        <div className="bg-[#161b22] border-b border-[#21262d] shrink-0">
          <div className="flex items-center gap-3 px-5 pt-5 pb-2">
            <button
              onClick={() => onMobileViewChange('preview')}
              className="flex items-center gap-1.5 text-[16px] font-medium text-[#9d8ffc] active:opacity-60 transition-opacity"
            >
              <ArrowLeft size={20} /> 미리보기
            </button>
            <div className="flex-1" />
            <span className={`text-[13px] transition-all duration-300 ${
              saved ? 'text-[#58a6ff] opacity-100' : saving ? 'text-[#8b949e] opacity-100' : 'opacity-0'
            }`}>
              {saved ? '저장됨' : '저장 중...'}
            </span>
          </div>
          <div className="px-5 pb-5 pt-1">
            <p className="text-[22px] font-bold text-[#f0f0f0] leading-tight truncate" style={{ letterSpacing: '-0.02em' }}>
              {note.title || '제목 없음'}
            </p>
          </div>
        </div>
        {/* 제목 + 태그 */}
        <div className="shrink-0 px-6 pt-6 pb-0">
          <input
            value={note.title}
            onChange={e => change('title', e.target.value)}
            readOnly={!canEdit}
            placeholder="제목 없음"
            className="w-full bg-transparent text-[1.8rem] font-bold text-[#e6edf3] placeholder-[#21262d] outline-none leading-tight mb-4"
            style={{ letterSpacing: '-0.02em' }}
          />
          <TagInput tags={note.tags || []} onChange={tags => change('tags', tags)} />
          <div className="border-t border-[#21262d] mt-4" />
        </div>
        {/* 본문 — 남은 공간 전체 채움 */}
        <textarea
          value={note.content}
          onChange={e => change('content', e.target.value)}
          readOnly={!canEdit}
          placeholder="내용을 입력하세요..."
          className="flex-1 w-full px-6 py-4 bg-transparent text-[#e6edf3] text-[1rem] leading-[2.0] resize-none outline-none placeholder-[#21262d] font-mono min-h-0"
          spellCheck={false}
        />
      </div>
    )
  }

  // 데스크탑 뷰
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0d1117]">
      {/* 툴바 */}
      <div className="flex items-center gap-2 px-6 py-2.5 border-b border-[#21262d] bg-[#161b22] shrink-0">
        <div className="flex bg-[#0d1117] rounded-lg p-0.5 gap-0.5">
          {CONTENT_TYPES.map((ct) => (
            <button
              key={ct.id}
              onClick={() => change('content_type', ct.id)}
              className={`flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-md transition-all duration-150 ${
                note.content_type === ct.id
                  ? 'bg-[#388bfd] text-white shadow-sm'
                  : 'text-[#8b949e] hover:text-[#cdd9e5]'
              }`}
            >
              <ct.Icon size={11} />
              {ct.label}
            </button>
          ))}
        </div>

        {isSplit && (
          <span className="text-[11px] text-[#484f58] select-none">미리보기 자동</span>
        )}

        <div className="flex-1" />

        {canEdit ? (
          <span className={`text-[11px] transition-all duration-300 ${
            saved ? 'text-[#58a6ff] opacity-100' : saving ? 'text-[#8b949e] opacity-100' : 'opacity-0'
          }`}>
            {saved ? '저장됨' : '저장 중...'}
          </span>
        ) : (
          <span className="text-[11px] text-[#484f58]">읽기 전용</span>
        )}
      </div>

      {isSplit ? (
        <PanelGroup direction="horizontal" className="flex-1 overflow-hidden">
          {/* 왼쪽: 편집 */}
          <Panel defaultSize={42} minSize={25}>
            <div className="h-full flex flex-col overflow-hidden border-r border-[#21262d]">
              <HeaderArea note={note} change={change} canEdit={canEdit} />
              <textarea
                ref={textareaRef}
                value={note.content}
                onChange={e => change('content', e.target.value)}
                onScroll={handleEditorScroll}
                readOnly={!canEdit}
                placeholder={
                  note.content_type === 'markdown'
                    ? '# 제목\n\n내용을 입력하세요...'
                    : '<h1>제목</h1>\n<p>내용을 입력하세요...</p>'
                }
                className="flex-1 w-full px-10 pb-10 bg-transparent text-[#e6edf3] text-[1rem] leading-[2.0] resize-none outline-none placeholder-[#21262d] font-mono"
                spellCheck={false}
              />
            </div>
          </Panel>

          {/* 드래그 핸들 */}
          <PanelResizeHandle className="w-1 bg-[#21262d] hover:bg-[#388bfd]/50 transition-colors duration-150 cursor-col-resize" />

          {/* 오른쪽: 미리보기 */}
          <Panel defaultSize={58} minSize={25}>
            <div ref={previewRef} onScroll={handlePreviewScroll} className="h-full overflow-y-auto">
              <div className="max-w-[760px] mx-auto px-10 py-10">
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
                      ? <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD_COMPONENTS}>{note.content}</ReactMarkdown>
                      : <p className="text-[#484f58] italic text-sm">내용을 입력하면 여기에 표시됩니다</p>
                    }
                  </div>
                ) : (
                  <div
                    className="text-[#cdd9e5] text-[1rem] leading-[2.0]"
                    dangerouslySetInnerHTML={{
                      __html: note.content || '<p style="color:#484f58;font-style:italic;font-size:0.875rem">내용을 입력하면 여기에 표시됩니다</p>'
                    }}
                  />
                )}
              </div>
            </div>
          </Panel>
        </PanelGroup>

      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[760px] mx-auto w-full px-16 py-10">
            <HeaderArea note={note} change={change} canEdit={canEdit} />
            <textarea
              value={note.content}
              onChange={e => change('content', e.target.value)}
              readOnly={!canEdit}
              placeholder="내용을 입력하세요..."
              className="w-full bg-transparent text-[#e6edf3] text-[1rem] leading-[2.0] resize-none outline-none placeholder-[#21262d]"
              style={{ minHeight: 'calc(100vh - 320px)' }}
              spellCheck={false}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function HeaderArea({ note, change, canEdit }) {
  return (
    <div className="max-w-[760px] mx-auto w-full px-10 pt-10 pb-4 shrink-0">
      <input
        value={note.title}
        onChange={e => change('title', e.target.value)}
        readOnly={!canEdit}
        placeholder="제목 없음"
        className="w-full bg-transparent text-[2.2rem] font-bold text-[#e6edf3] placeholder-[#21262d] outline-none leading-tight mb-4"
        style={{ letterSpacing: '-0.02em' }}
      />
      <TagInput
        tags={note.tags || []}
        onChange={tags => change('tags', tags)}
      />
      <div className="border-t border-[#21262d] mt-4" />
    </div>
  )
}
