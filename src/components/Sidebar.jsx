import { useState, useMemo } from 'react'
import { Plus, Search, Tag, FileText, Trash2, X } from 'lucide-react'

export default function Sidebar({ notes, selectedId, onSelect, onCreate, onDelete }) {
  const [search, setSearch] = useState('')
  const [activeTag, setActiveTag] = useState(null)

  const allTags = useMemo(() => {
    const tagSet = new Set()
    notes.forEach(n => (n.tags || []).forEach(t => tagSet.add(t)))
    return [...tagSet].sort()
  }, [notes])

  const filtered = useMemo(() => {
    return notes.filter(n => {
      const matchSearch =
        !search ||
        n.title.toLowerCase().includes(search.toLowerCase())
      const matchTag =
        !activeTag || (n.tags || []).includes(activeTag)
      return matchSearch && matchTag
    })
  }, [notes, search, activeTag])

  const fmt = (iso) => {
    const d = new Date(iso)
    return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
  }

  return (
    <aside className="w-72 flex flex-col bg-[#161618] border-r border-[#242428] h-full shrink-0">
      {/* 헤더 */}
      <div className="px-4 pt-5 pb-3 border-b border-[#242428]">
        <div className="flex items-center justify-between mb-3">
          <span className="text-base font-semibold text-white tracking-tight">Notepad</span>
          <button
            onClick={onCreate}
            className="flex items-center gap-1.5 bg-[#7c6af5] hover:bg-[#6b5ce7] text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
          >
            <Plus size={14} />
            새 메모
          </button>
        </div>
        {/* 검색 */}
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#606070]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="제목 검색..."
            className="w-full bg-[#1e1e28] text-sm text-[#c0c0d0] placeholder-[#505060] pl-8 pr-3 py-2 rounded-lg border border-[#2a2a38] focus:outline-none focus:border-[#7c6af5] transition-colors"
          />
        </div>
      </div>

      {/* 태그 필터 */}
      {allTags.length > 0 && (
        <div className="px-4 py-2.5 border-b border-[#242428] flex flex-wrap gap-1.5">
          {activeTag && (
            <button
              onClick={() => setActiveTag(null)}
              className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-[#7c6af5] text-white"
            >
              <X size={10} />
              전체
            </button>
          )}
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border transition-colors ${
                activeTag === tag
                  ? 'bg-[#7c6af5]/20 border-[#7c6af5] text-[#a990ff]'
                  : 'border-[#2a2a38] text-[#707090] hover:border-[#3a3a58] hover:text-[#9090b0]'
              }`}
            >
              <Tag size={10} />
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* 메모 목록 */}
      <div className="flex-1 overflow-y-auto py-2">
        {filtered.length === 0 ? (
          <div className="text-center text-[#505060] text-sm mt-10">
            <FileText size={28} className="mx-auto mb-2 opacity-40" />
            메모가 없어요
          </div>
        ) : (
          filtered.map(note => (
            <div
              key={note.id}
              onClick={() => onSelect(note.id)}
              className={`group relative mx-2 mb-1 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                selectedId === note.id
                  ? 'bg-[#7c6af5]/15 border border-[#7c6af5]/40'
                  : 'hover:bg-[#1e1e28] border border-transparent'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className={`text-sm font-medium leading-tight truncate ${
                  selectedId === note.id ? 'text-white' : 'text-[#d0d0e0]'
                }`}>
                  {note.title || '제목 없음'}
                </p>
                <button
                  onClick={e => { e.stopPropagation(); onDelete(note.id) }}
                  className="opacity-0 group-hover:opacity-100 text-[#505060] hover:text-red-400 transition-all shrink-0 mt-0.5"
                >
                  <Trash2 size={13} />
                </button>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[#505060] text-xs">{fmt(note.updated_at)}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${
                  note.content_type === 'markdown'
                    ? 'text-[#a990ff] border-[#7c6af5]/30 bg-[#7c6af5]/10'
                    : note.content_type === 'html'
                    ? 'text-[#f38ba8] border-[#f38ba8]/30 bg-[#f38ba8]/10'
                    : 'text-[#a6e3a1] border-[#a6e3a1]/30 bg-[#a6e3a1]/10'
                }`}>
                  {note.content_type}
                </span>
                {(note.tags || []).slice(0, 2).map(t => (
                  <span key={t} className="text-[#606070] text-[10px]">#{t}</span>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  )
}
