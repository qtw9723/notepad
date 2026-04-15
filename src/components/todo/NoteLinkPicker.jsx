import { useState, useMemo } from 'react'
import { FileText, Search, X, Plus, Link } from 'lucide-react'

export function NoteLinkPicker({ notes, selectedNoteIds = [], onChange }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const selectedNotes = useMemo(
    () => selectedNoteIds.map(id => notes.find(n => n.id === id)).filter(Boolean),
    [notes, selectedNoteIds]
  )

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return notes
      .filter(n => n.title?.trim())
      .filter(n => !selectedNoteIds.includes(n.id))
      .filter(n => !q || n.title.toLowerCase().includes(q))
      .slice(0, 30)
  }, [notes, selectedNoteIds, search])

  const handleAdd = (note) => {
    onChange([...selectedNoteIds, note.id])
    setSearch('')
  }

  const handleRemove = (id) => {
    onChange(selectedNoteIds.filter(nid => nid !== id))
  }

  return (
    <div>
      <label className="flex items-center gap-1 text-[11px] mb-1.5" style={{ color: '#606070' }}>
        <Link size={11} /> 노트 연결
      </label>

      {/* 선택된 노트 목록 */}
      {selectedNotes.length > 0 && (
        <div className="flex flex-col gap-1 mb-1.5">
          {selectedNotes.map(note => (
            <div
              key={note.id}
              className="flex items-center gap-2 px-3 py-2 rounded-lg"
              style={{ background: 'rgba(88,166,255,0.07)', border: '1px solid rgba(88,166,255,0.2)' }}
            >
              <FileText size={13} style={{ color: '#58a6ff', flexShrink: 0 }} />
              <span className="flex-1 truncate text-[13px]" style={{ color: '#79c0ff' }}>
                {note.title || '제목 없음'}
              </span>
              <button onClick={() => handleRemove(note.id)} style={{ color: '#484f58' }}>
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 추가 버튼 */}
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] transition-colors"
        style={{
          background: open ? '#161b22' : 'transparent',
          border: '1px dashed #21262d',
          color: '#484f58',
          width: '100%',
          textAlign: 'left',
        }}
      >
        <Plus size={12} />
        노트 추가...
      </button>

      {/* 드롭다운 */}
      {open && (
        <div
          className="mt-1 rounded-xl overflow-hidden"
          style={{ background: '#161b22', border: '1px solid #21262d', maxHeight: 200, overflowY: 'auto' }}
        >
          <div className="px-3 py-2 sticky top-0" style={{ background: '#161b22', borderBottom: '1px solid #21262d' }}>
            <div className="flex items-center gap-2">
              <Search size={12} style={{ color: '#484f58', flexShrink: 0 }} />
              <input
                autoFocus
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => { if (e.key === 'Escape') setOpen(false) }}
                placeholder="노트 검색..."
                className="flex-1 bg-transparent outline-none text-[12px]"
                style={{ color: '#cdd9e5' }}
              />
            </div>
          </div>
          {filtered.length === 0 ? (
            <p className="px-3 py-3 text-[12px]" style={{ color: '#484f58' }}>
              {notes.filter(n => n.title?.trim()).length === 0 ? '노트 없음' : '결과 없음'}
            </p>
          ) : (
            filtered.map(note => (
              <button
                key={note.id}
                onClick={() => { handleAdd(note); setOpen(false) }}
                className="w-full text-left px-3 py-2.5 flex items-center gap-2 transition-colors hover:bg-white/5"
              >
                <FileText size={13} style={{ color: '#484f58', flexShrink: 0 }} />
                <span className="truncate text-[13px]" style={{ color: '#cdd9e5' }}>
                  {note.title || '제목 없음'}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
