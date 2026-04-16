import { useState } from 'react'
import { Plus, Filter, SortAsc, Sun } from 'lucide-react'
import { TodoItem } from './TodoItem'
import { TodoItemModal } from './TodoItemModal'
import { TodoAddModal } from './TodoAddModal'
import { NotePreviewPanel } from './NotePreviewPanel'

const SORT_OPTIONS = [
  { value: 'order',    label: '기본' },
  { value: 'time',     label: '시간' },
  { value: 'priority', label: '우선순위' },
  { value: 'due',      label: '마감일' },
]

const FILTER_OPTIONS = [
  { value: 'all',    label: '전체' },
  { value: 'today',  label: '오늘' },
  { value: 'active', label: '미완료' },
  { value: 'done',   label: '완료' },
]

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function isItemDueToday(item) {
  const today = todayStr()
  const start = item.start_date
  // start_date가 오늘 이하인 미완료 항목 (오늘 + 미완료 이전 항목)
  if (start && start <= today) return true
  return false
}

function sortItems(items, sort) {
  const arr = [...items]
  if (sort === 'time') {
    return arr.sort((a, b) => {
      if (!a.scheduled_time && !b.scheduled_time) return a.order_index - b.order_index
      if (!a.scheduled_time) return 1
      if (!b.scheduled_time) return -1
      return a.scheduled_time.localeCompare(b.scheduled_time)
    })
  }
  if (sort === 'priority') return arr.sort((a, b) => (b.priority ?? 1) - (a.priority ?? 1))
  if (sort === 'due') return arr.sort((a, b) => {
    if (!a.due_date && !b.due_date) return 0
    if (!a.due_date) return 1
    if (!b.due_date) return -1
    return new Date(a.due_date) - new Date(b.due_date)
  })
  return arr.sort((a, b) => a.order_index - b.order_index)
}

export function TodoBoard({ list, items, notes = [], fetchNote, onCreateItem, onUpdateItem, onDeleteItem }) {
  const [sort, setSort] = useState('time')
  const [filter, setFilter] = useState('active')
  const [editingItem, setEditingItem] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showSortMenu, setShowSortMenu] = useState(false)
  const [showFilterMenu, setShowFilterMenu] = useState(false)
  const [quickText, setQuickText] = useState('')
  const [showQuick, setShowQuick] = useState(false)
  const [previewNote, setPreviewNote] = useState(null)

  const handleAdd = async (data) => {
    if (!list) return
    await onCreateItem(list.id, data)
  }

  const handleQuickAdd = async () => {
    const text = quickText.trim()
    if (!text || !list) return
    const today = todayStr()
    await onCreateItem(list.id, { text, start_date: today, due_date: today, recurrence: 'none' })
    setQuickText('')
  }

  const filtered = items.filter(i => {
    if (filter === 'today') return isItemDueToday(i) && !i.done
    if (filter === 'active') return !i.done
    if (filter === 'done') return i.done
    return true
  })
  const sorted = sortItems(filtered, sort)

  const doneCount = items.filter(i => i.done).length
  const totalCount = items.length
  const todayCount = items.filter(i => isItemDueToday(i) && !i.done).length

  return (
    <div
      className="flex-1 flex flex-col h-full min-w-0"
      style={{ background: '#0d1117' }}
      onClick={() => { setShowSortMenu(false); setShowFilterMenu(false) }}
    >
      {/* board header */}
      <div
        className="flex items-center justify-between px-6 py-4 flex-shrink-0"
        style={{ borderBottom: '1px solid #21262d' }}
      >
        <div className="flex items-center gap-3">
          {list && <div className="w-3 h-3 rounded-full" style={{ background: list.color }} />}
          <h2 className="text-[16px] font-semibold" style={{ color: '#e6edf3' }}>
            {list ? list.title : '전체'}
          </h2>
          <span className="text-[12px]" style={{ color: '#606070' }}>{doneCount}/{totalCount}</span>
          {todayCount > 0 && (
            <span
              className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(86,211,100,0.1)', color: '#56d364' }}
            >
              <Sun size={10} /> 오늘 {todayCount}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          {/* filter */}
          <div className="relative">
            <button
              onClick={() => { setShowFilterMenu(v => !v); setShowSortMenu(false) }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px]"
              style={{
                background: '#161b22',
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
                    className="w-full text-left px-3 py-2 text-[12px] hover:bg-white/5"
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
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px]"
              style={{
                background: '#161b22',
                color: sort !== 'time' ? '#9d8ffc' : '#8b949e',
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
                    className="w-full text-left px-3 py-2 text-[12px] hover:bg-white/5"
                    style={{ color: sort === opt.value ? '#9d8ffc' : '#8b949e' }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {list && (
            <div className="flex gap-1.5">
              {/* 당일 빠른 추가 */}
              <button
                onClick={() => setShowQuick(v => !v)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px]"
                style={{
                  background: showQuick ? 'rgba(86,211,100,0.1)' : '#161b22',
                  color: showQuick ? '#56d364' : '#8b949e',
                  border: `1px solid ${showQuick ? 'rgba(86,211,100,0.3)' : '#21262d'}`,
                }}
                title="당일 빠른 추가"
              >
                <Sun size={13} />
                당일
              </button>

              {/* 전체 추가 모달 */}
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px]"
                style={{ background: '#7c6af5', color: '#fff' }}
              >
                <Plus size={13} />
                추가
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 당일 빠른 추가 */}
      {showQuick && list && (
        <div className="px-6 py-3 flex gap-2" style={{ borderBottom: '1px solid #21262d', background: 'rgba(86,211,100,0.03)' }}>
          <Sun size={15} style={{ color: '#56d364', flexShrink: 0, marginTop: 8 }} />
          <input
            autoFocus
            value={quickText}
            onChange={e => setQuickText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleQuickAdd(); if (e.key === 'Escape') setShowQuick(false) }}
            placeholder="오늘 할 일을 빠르게 입력... (Enter)"
            className="flex-1 px-3 py-2 rounded-lg text-[13px] outline-none"
            style={{ background: '#161b22', color: '#cdd9e5', border: '1px solid rgba(86,211,100,0.25)' }}
          />
          <button
            onClick={handleQuickAdd}
            className="px-3 py-2 rounded-lg text-[12px]"
            style={{ background: 'rgba(86,211,100,0.15)', color: '#56d364' }}
          >
            추가
          </button>
        </div>
      )}

      {/* items */}
      <div className="flex-1 overflow-y-auto">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48">
            <span className="text-[14px]" style={{ color: '#21262d' }}>
              {filter === 'done' ? '완료된 항목 없음' :
               filter === 'today' ? '오늘 예정된 항목 없음' :
               list ? '항목을 추가해보세요' : '목록을 선택해주세요'}
            </span>
          </div>
        ) : (
          sorted.map(item => (
            <TodoItem
              key={item.id}
              item={item}
              notes={notes}
              onUpdate={onUpdateItem}
              onDelete={onDeleteItem}
              onClick={setEditingItem}
              onNoteClick={setPreviewNote}
            />
          ))
        )}
      </div>

      {editingItem && (
        <TodoItemModal
          item={editingItem}
          notes={notes}
          fetchNote={fetchNote}
          onClose={() => setEditingItem(null)}
          onUpdate={onUpdateItem}
          onDelete={onDeleteItem}
        />
      )}

      {showAddModal && list && (
        <TodoAddModal
          notes={notes}
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAdd}
        />
      )}

      {previewNote && (
        <NotePreviewPanel
          note={previewNote}
          fetchNote={fetchNote}
          onClose={() => setPreviewNote(null)}
        />
      )}
    </div>
  )
}
