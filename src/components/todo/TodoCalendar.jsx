import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { TodoItemModal } from './TodoItemModal'
import { NotePreviewPanel } from './NotePreviewPanel'

const WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일']
const MONTHS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']

function toKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
}

function getCalendarGrid(year, month) {
  const firstDay = new Date(year, month, 1)
  const lastDay  = new Date(year, month + 1, 0)
  const startOffset = (firstDay.getDay() + 6) % 7   // 0=월, 6=일

  const days = []
  for (let i = startOffset - 1; i >= 0; i--) {
    days.push({ date: new Date(year, month, -i), current: false })
  }
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push({ date: new Date(year, month, d), current: true })
  }
  const fill = (7 - (days.length % 7)) % 7
  for (let i = 1; i <= fill; i++) {
    days.push({ date: new Date(year, month + 1, i), current: false })
  }
  return days
}

export function TodoCalendar({ lists, allItems, notes, fetchNote, onUpdateItem, onDeleteItem }) {
  const today = new Date()
  const todayKey = toKey(today)

  const [viewYear,  setViewYear]  = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [editingItem,  setEditingItem]  = useState(null)
  const [previewNote,  setPreviewNote]  = useState(null)

  const days = useMemo(() => getCalendarGrid(viewYear, viewMonth), [viewYear, viewMonth])

  /* 날짜별 아이템 맵 */
  const byDate = useMemo(() => {
    const map = new Map()
    allItems.forEach(item => {
      const key = item.start_date?.split('T')[0]
      if (!key) return
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(item)
    })
    // 시간 순 정렬
    map.forEach(arr => arr.sort((a, b) => (a.scheduled_time ?? '').localeCompare(b.scheduled_time ?? '')))
    return map
  }, [allItems])

  /* 리스트 색상 맵 */
  const colorMap = useMemo(() => {
    const m = new Map()
    lists.forEach(l => m.set(l.id, l.color))
    return m
  }, [lists])

  const prev = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }
  const next = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  const monthItemCount = allItems.filter(i => {
    const key = i.start_date?.split('T')[0] ?? ''
    return key.startsWith(`${viewYear}-${String(viewMonth+1).padStart(2,'0')}`)
  }).length

  return (
    <div className="flex-1 flex flex-col h-full min-w-0" style={{ background: '#0d1117' }}>

      {/* header */}
      <div
        className="flex items-center justify-between px-6 py-4 flex-shrink-0"
        style={{ borderBottom: '1px solid #21262d' }}
      >
        <div className="flex items-center gap-2">
          <button
            onClick={prev}
            className="p-1.5 rounded-lg transition-colors hover:bg-white/5"
            style={{ color: '#8b949e' }}
          >
            <ChevronLeft size={16} />
          </button>
          <h2 className="text-[16px] font-semibold min-w-[120px] text-center" style={{ color: '#e6edf3' }}>
            {viewYear}년 {MONTHS[viewMonth]}
          </h2>
          <button
            onClick={next}
            className="p-1.5 rounded-lg transition-colors hover:bg-white/5"
            style={{ color: '#8b949e' }}
          >
            <ChevronRight size={16} />
          </button>
          <button
            onClick={() => { setViewYear(today.getFullYear()); setViewMonth(today.getMonth()) }}
            className="px-2.5 py-1 rounded-lg text-[12px] transition-colors hover:bg-white/5"
            style={{ color: '#8b949e', border: '1px solid #21262d' }}
          >
            오늘
          </button>
        </div>
        <span className="text-[12px]" style={{ color: '#606070' }}>
          이번 달 일정 {monthItemCount}개
        </span>
      </div>

      {/* weekday row */}
      <div className="grid grid-cols-7 flex-shrink-0" style={{ borderBottom: '1px solid #21262d' }}>
        {WEEKDAYS.map((w, i) => (
          <div
            key={w}
            className="py-2 text-center text-[11px] font-medium"
            style={{ color: i >= 5 ? '#58a6ff' : '#606070' }}
          >
            {w}
          </div>
        ))}
      </div>

      {/* grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-7">
          {days.map(({ date, current }, idx) => {
            const key    = toKey(date)
            const items  = byDate.get(key) ?? []
            const isToday = key === todayKey
            const isSat   = date.getDay() === 6
            const isSun   = date.getDay() === 0
            const MAX     = 4

            return (
              <div
                key={idx}
                className="flex flex-col p-1.5"
                style={{
                  minHeight: 100,
                  borderRight: (idx + 1) % 7 === 0 ? 'none' : '1px solid #161b22',
                  borderBottom: '1px solid #161b22',
                  background: isToday ? 'rgba(124,106,245,0.04)' : 'transparent',
                }}
              >
                {/* 날짜 숫자 */}
                <div className="flex justify-end mb-1">
                  <span
                    className="text-[12px] w-6 h-6 flex items-center justify-center rounded-full leading-none"
                    style={{
                      color: !current ? '#21262d'
                           : isToday  ? '#fff'
                           : (isSat || isSun) ? '#58a6ff'
                           : '#8b949e',
                      background: isToday ? '#7c6af5' : 'transparent',
                      fontWeight: isToday ? 700 : 400,
                    }}
                  >
                    {date.getDate()}
                  </span>
                </div>

                {/* 아이템 */}
                <div className="flex flex-col gap-0.5">
                  {items.slice(0, MAX).map(item => {
                    const color = colorMap.get(item.list_id) ?? '#9d8ffc'
                    return (
                      <button
                        key={item.id}
                        onClick={() => setEditingItem(item)}
                        className="w-full text-left px-1.5 py-0.5 rounded text-[11px] leading-tight truncate transition-opacity hover:opacity-75"
                        style={{
                          background: `${color}18`,
                          borderLeft: `2px solid ${color}`,
                          color: item.done ? '#484f58' : '#cdd9e5',
                          textDecoration: item.done ? 'line-through' : 'none',
                        }}
                        title={item.text}
                      >
                        {item.scheduled_time && (
                          <span className="mr-1" style={{ color, fontVariantNumeric: 'tabular-nums' }}>
                            {item.scheduled_time.slice(0, 5)}
                          </span>
                        )}
                        {item.text}
                      </button>
                    )
                  })}
                  {items.length > MAX && (
                    <span className="text-[10px] px-1.5 pt-0.5" style={{ color: '#484f58' }}>
                      +{items.length - MAX}개 더
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 수정 모달 */}
      {editingItem && (
        <TodoItemModal
          item={editingItem}
          notes={notes}
          fetchNote={fetchNote}
          onClose={() => setEditingItem(null)}
          onUpdate={(id, changes) => { onUpdateItem(id, changes); setEditingItem(prev => prev && { ...prev, ...changes }) }}
          onDelete={(id) => { onDeleteItem(id); setEditingItem(null) }}
        />
      )}

      {previewNote && fetchNote && (
        <NotePreviewPanel
          note={previewNote}
          fetchNote={fetchNote}
          onClose={() => setPreviewNote(null)}
        />
      )}
    </div>
  )
}
