import { useState, useMemo } from 'react'
import { FileText, Search, X, Link } from 'lucide-react'

export function NoteLinkPicker({ notes, selectedNoteId, onChange }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const selectedNote = useMemo(() => notes.find(n => n.id === selectedNoteId), [notes, selectedNoteId])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return notes
      .filter(n => n.title?.trim())
      .filter(n => !q || n.title.toLowerCase().includes(q))
      .slice(0, 30)
  }, [notes, search])

  const handleSelect = (note) => {
    onChange(note.id === selectedNoteId ? null : note.id)
    setOpen(false)
    setSearch('')
  }

  return (
    <div>
      <label className="flex items-center gap-1 text-[11px] mb-1.5" style={{ color: '#606070' }}>
        <Link size={11} /> 노트 연결
      </label>

      {/* selected note or picker trigger */}
      {selectedNote ? (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg"
          style={{ background: 'rgba(88,166,255,0.07)', border: '1px solid rgba(88,166,255,0.2)' }}
        >
          <FileText size={13} style={{ color: '#58a6ff', flexShrink: 0 }} />
          <span className="flex-1 truncate text-[13px]" style={{ color: '#79c0ff' }}>{selectedNote.title || '제목 없음'}</span>
          <button onClick={() => onChange(null)} style={{ color: '#484f58' }}>
            <X size={13} />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setOpen(v => !v)}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] transition-colors text-left"
          style={{
            background: open ? '#161b22' : 'transparent',
            border: '1px dashed #21262d',
            color: '#484f58',
          }}
        >
          <FileText size={13} />
          노트와 연결...
        </button>
      )}

      {/* dropdown */}
      {open && !selectedNote && (
        <div
          className="mt-1 rounded-xl overflow-hidden"
          style={{ background: '#161b22', border: '1px solid #21262d', maxHeight: 220, overflowY: 'auto' }}
        >
          <div className="px-3 py-2 sticky top-0" style={{ background: '#161b22', borderBottom: '1px solid #21262d' }}>
            <div className="flex items-center gap-2">
              <Search size={12} style={{ color: '#484f58', flexShrink: 0 }} />
              <input
                autoFocus
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="노트 검색..."
                className="flex-1 bg-transparent outline-none text-[12px]"
                style={{ color: '#cdd9e5' }}
              />
            </div>
          </div>
          {filtered.length === 0 ? (
            <p className="px-3 py-3 text-[12px]" style={{ color: '#484f58' }}>노트 없음</p>
          ) : (
            filtered.map(note => (
              <button
                key={note.id}
                onClick={() => handleSelect(note)}
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
