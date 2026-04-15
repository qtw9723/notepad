import { useState } from 'react'
import { Plus, Trash2, LayoutList, Check } from 'lucide-react'

const LIST_COLORS = [
  '#9d8ffc', '#7c6af5', '#58a6ff', '#56d364',
  '#f78166', '#e3b341', '#db61a2', '#79c0ff',
]

function ColorPicker({ value, onChange }) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {LIST_COLORS.map(c => (
        <button
          key={c}
          onClick={() => onChange(c)}
          style={{ background: c }}
          className="w-5 h-5 rounded-full flex items-center justify-center transition-transform hover:scale-110"
        >
          {value === c && <Check size={11} className="text-white" strokeWidth={3} />}
        </button>
      ))}
    </div>
  )
}

export function TodoSidebar({ lists, selectedListId, onSelectList, onCreateList, onDeleteList, user }) {
  const [creating, setCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newColor, setNewColor] = useState('#9d8ffc')
  const [deletingId, setDeletingId] = useState(null)

  const handleCreate = async () => {
    const title = newTitle.trim()
    if (!title) return
    await onCreateList(title, newColor)
    setNewTitle('')
    setNewColor('#9d8ffc')
    setCreating(false)
  }

  return (
    <aside
      className="flex flex-col h-full"
      style={{ width: 220, background: '#0d0d14', borderRight: '1px solid #21262d', flexShrink: 0 }}
    >
      {/* header */}
      <div className="flex items-center justify-between px-4 py-4" style={{ borderBottom: '1px solid #21262d' }}>
        <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#606070', letterSpacing: '0.1em' }}>
          Lists
        </span>
        <button
          onClick={() => setCreating(v => !v)}
          className="flex items-center gap-1 px-2 py-1 rounded text-[11px] transition-colors"
          style={{ color: '#9d8ffc', background: creating ? 'rgba(157,143,252,0.1)' : 'transparent' }}
        >
          <Plus size={13} />
          새 목록
        </button>
      </div>

      {/* create form */}
      {creating && (
        <div className="px-3 py-3" style={{ borderBottom: '1px solid #21262d' }}>
          <input
            autoFocus
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setCreating(false) }}
            placeholder="목록 이름"
            className="w-full px-2 py-1.5 rounded text-[13px] mb-2 outline-none"
            style={{ background: '#161b22', color: '#cdd9e5', border: '1px solid #21262d' }}
          />
          <ColorPicker value={newColor} onChange={setNewColor} />
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleCreate}
              className="flex-1 py-1 rounded text-[12px] font-medium transition-colors"
              style={{ background: '#7c6af5', color: '#fff' }}
            >
              만들기
            </button>
            <button
              onClick={() => setCreating(false)}
              className="flex-1 py-1 rounded text-[12px] transition-colors"
              style={{ background: '#21262d', color: '#8b949e' }}
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* all items */}
      <button
        onClick={() => onSelectList(null)}
        className="flex items-center gap-2.5 px-3 py-2.5 mx-2 mt-2 rounded-lg text-[13px] transition-colors"
        style={{
          color: selectedListId === null ? '#cdd9e5' : '#8b949e',
          background: selectedListId === null ? 'rgba(157,143,252,0.1)' : 'transparent',
          fontWeight: selectedListId === null ? 550 : 400,
        }}
      >
        <LayoutList size={14} style={{ color: selectedListId === null ? '#9d8ffc' : '#606070' }} />
        전체
      </button>

      {/* list items */}
      <div className="flex-1 overflow-y-auto py-1">
        {lists.map(list => (
          <div
            key={list.id}
            className="group flex items-center gap-2.5 px-3 py-2.5 mx-2 rounded-lg cursor-pointer transition-colors"
            style={{
              color: selectedListId === list.id ? '#cdd9e5' : '#8b949e',
              background: selectedListId === list.id ? 'rgba(157,143,252,0.08)' : 'transparent',
              fontWeight: selectedListId === list.id ? 550 : 400,
            }}
            onClick={() => onSelectList(list.id)}
          >
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: list.color }} />
            <span className="flex-1 truncate text-[13px]">{list.title}</span>
            {deletingId === list.id ? (
              <div className="flex gap-1">
                <button
                  onClick={e => { e.stopPropagation(); onDeleteList(list.id); setDeletingId(null) }}
                  className="text-[11px] px-1.5 py-0.5 rounded"
                  style={{ background: 'rgba(248,113,113,0.15)', color: 'rgb(248,113,113)' }}
                >
                  삭제
                </button>
                <button
                  onClick={e => { e.stopPropagation(); setDeletingId(null) }}
                  className="text-[11px] px-1.5 py-0.5 rounded"
                  style={{ background: '#21262d', color: '#8b949e' }}
                >
                  취소
                </button>
              </div>
            ) : (
              <button
                onClick={e => { e.stopPropagation(); setDeletingId(list.id) }}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded"
                style={{ color: '#606070' }}
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* footer */}
      <div className="px-3 py-3 text-[12px]" style={{ borderTop: '1px solid #21262d', color: '#606070' }}>
        {user?.email}
      </div>
    </aside>
  )
}
