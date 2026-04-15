import { useState } from 'react'
import { Plus, Filter, SortAsc } from 'lucide-react'
import { TodoItem } from './TodoItem'
import { TodoItemModal } from './TodoItemModal'

const SORT_OPTIONS = [
  { value: 'order', label: '기본' },
  { value: 'priority', label: '우선순위' },
  { value: 'due', label: '마감일' },
]

const FILTER_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'active', label: '미완료' },
  { value: 'done', label: '완료' },
]

function sortItems(items, sort) {
  const arr = [...items]
  if (sort === 'priority') return arr.sort((a, b) => (b.priority ?? 1) - (a.priority ?? 1))
  if (sort === 'due') return arr.sort((a, b) => {
    if (!a.due_date && !b.due_date) return 0
    if (!a.due_date) return 1
    if (!b.due_date) return -1
    return new Date(a.due_date) - new Date(b.due_date)
  })
  return arr.sort((a, b) => a.order_index - b.order_index)
}

export function TodoBoard({ list, items, onCreateItem, onUpdateItem, onDeleteItem }) {
  const [newText, setNewText] = useState('')
  const [adding, setAdding] = useState(false)
  const [sort, setSort] = useState('order')
  const [filter, setFilter] = useState('active')
  const [editingItem, setEditingItem] = useState(null)
  const [showSortMenu, setShowSortMenu] = useState(false)
  const [showFilterMenu, setShowFilterMenu] = useState(false)

  const handleAddItem = async () => {
    const text = newText.trim()
    if (!text || !list) return
    await onCreateItem(list.id, { text })
    setNewText('')
    setAdding(false)
  }

  const filtered = items.filter(i => {
    if (filter === 'active') return !i.done
    if (filter === 'done') return i.done
    return true
  })
  const sorted = sortItems(filtered, sort)

  const doneCount = items.filter(i => i.done).length
  const totalCount = items.length

  return (
    <div className="flex-1 flex flex-col h-full min-w-0" style={{ background: '#0d1117' }}>
      {/* board header */}
      <div
        className="flex items-center justify-between px-6 py-4 flex-shrink-0"
        style={{ borderBottom: '1px solid #21262d' }}
      >
        <div className="flex items-center gap-3">
          {list && (
            <div className="w-3 h-3 rounded-full" style={{ background: list.color }} />
          )}
          <h2 className="text-[16px] font-semibold" style={{ color: '#e6edf3' }}>
            {list ? list.title : '전체'}
          </h2>
          <span className="text-[12px]" style={{ color: '#606070' }}>
            {doneCount}/{totalCount}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* filter */}
          <div className="relative">
            <button
              onClick={() => { setShowFilterMenu(v => !v); setShowSortMenu(false) }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] transition-colors"
              style={{
                background: showFilterMenu ? 'rgba(157,143,252,0.1)' : '#161b22',
                color: filter !== 'active' ? '#9d8ffc' : '#8b949e',
                border: '1px solid #21262d',
              }}
            >
              <Filter size={12} />
              {FILTER_OPTIONS.find(f => f.value === filter)?.label}
            </button>
            {showFilterMenu && (
              <div
                className="absolute right-0 top-full mt-1 rounded-lg overflow-hidden z-10"
                style={{ background: '#161b22', border: '1px solid #21262d', minWidth: 80 }}
              >
                {FILTER_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { setFilter(opt.value); setShowFilterMenu(false) }}
                    className="w-full text-left px-3 py-2 text-[12px] transition-colors hover:bg-white/5"
                    style={{ color: filter === opt.value ? '#9d8ffc' : '#8b949e' }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* sort */}
          <div className="relative">
            <button
              onClick={() => { setShowSortMenu(v => !v); setShowFilterMenu(false) }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] transition-colors"
              style={{
                background: showSortMenu ? 'rgba(157,143,252,0.1)' : '#161b22',
                color: sort !== 'order' ? '#9d8ffc' : '#8b949e',
                border: '1px solid #21262d',
              }}
            >
              <SortAsc size={12} />
              {SORT_OPTIONS.find(s => s.value === sort)?.label}
            </button>
            {showSortMenu && (
              <div
                className="absolute right-0 top-full mt-1 rounded-lg overflow-hidden z-10"
                style={{ background: '#161b22', border: '1px solid #21262d', minWidth: 80 }}
              >
                {SORT_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { setSort(opt.value); setShowSortMenu(false) }}
                    className="w-full text-left px-3 py-2 text-[12px] transition-colors hover:bg-white/5"
                    style={{ color: sort === opt.value ? '#9d8ffc' : '#8b949e' }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {list && (
            <button
              onClick={() => setAdding(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] transition-colors"
              style={{ background: '#7c6af5', color: '#fff' }}
            >
              <Plus size={13} />
              추가
            </button>
          )}
        </div>
      </div>

      {/* add input */}
      {adding && list && (
        <div className="px-6 py-3" style={{ borderBottom: '1px solid #21262d' }}>
          <div className="flex gap-2">
            <input
              autoFocus
              value={newText}
              onChange={e => setNewText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAddItem(); if (e.key === 'Escape') setAdding(false) }}
              placeholder="새 항목 입력..."
              className="flex-1 px-3 py-2 rounded-lg text-[13px] outline-none"
              style={{ background: '#161b22', color: '#cdd9e5', border: '1px solid rgba(157,143,252,0.3)' }}
            />
            <button
              onClick={handleAddItem}
              className="px-3 py-2 rounded-lg text-[12px]"
              style={{ background: '#7c6af5', color: '#fff' }}
            >
              추가
            </button>
            <button
              onClick={() => setAdding(false)}
              className="px-3 py-2 rounded-lg text-[12px]"
              style={{ background: '#21262d', color: '#8b949e' }}
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* items */}
      <div className="flex-1 overflow-y-auto">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2">
            <span className="text-[14px]" style={{ color: '#21262d' }}>
              {filter === 'done' ? '완료된 항목이 없습니다' : list ? '항목을 추가해보세요' : '목록을 선택해주세요'}
            </span>
          </div>
        ) : (
          sorted.map(item => (
            <TodoItem
              key={item.id}
              item={item}
              onUpdate={onUpdateItem}
              onDelete={onDeleteItem}
              onClick={setEditingItem}
            />
          ))
        )}
      </div>

      {editingItem && (
        <TodoItemModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onUpdate={onUpdateItem}
          onDelete={onDeleteItem}
        />
      )}
    </div>
  )
}
