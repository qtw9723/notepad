import { useState, useMemo, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { TodoItemModal } from './TodoItemModal'

const DAY_KO = ['일', '월', '화', '수', '목', '금', '토']
const MONTH_KO = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']
const PX_PER_MIN = 1  // 60px per hour

function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function timeToMin(t) {
  if (!t) return 0
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function minToTimeStr(m) {
  return `${String(Math.floor(m / 60)).padStart(2,'0')}:${String(m % 60).padStart(2,'0')}`
}

// 겹치는 이벤트를 칼럼으로 분배
function calcColumns(events) {
  const sorted = [...events].sort((a, b) => timeToMin(a.scheduled_time) - timeToMin(b.scheduled_time))
  const colEnds = []
  const placed = []

  for (const ev of sorted) {
    const start = timeToMin(ev.scheduled_time)
    const end = start + ev._duration
    let col = colEnds.findIndex(e => e <= start)
    if (col === -1) col = colEnds.length
    colEnds[col] = end
    placed.push({ ev, col })
  }

  return placed.map(({ ev, col }) => {
    const start = timeToMin(ev.scheduled_time)
    const end = start + ev._duration
    const overlapping = placed.filter(({ ev: e2 }) => {
      const s2 = timeToMin(e2.scheduled_time)
      return s2 < end && (s2 + e2._duration) > start
    })
    const totalCols = Math.max(...overlapping.map(o => o.col)) + 1
    return { ev, col, totalCols }
  })
}

export function TodoTimeline({ lists, allItems, notes, fetchNote, onUpdateItem, onDeleteItem }) {
  const today = new Date()
  const [current, setCurrent] = useState(new Date(today.getFullYear(), today.getMonth(), today.getDate()))
  const [editingItem, setEditingItem] = useState(null)
  const scrollRef = useRef(null)

  const dateStr = toDateStr(current)
  const isToday = dateStr === toDateStr(today)

  const listMap = useMemo(() => {
    const m = new Map()
    lists.forEach(l => m.set(l.id, l))
    return m
  }, [lists])

  const dayItems = useMemo(() =>
    allItems.filter(i => i.start_date?.startsWith(dateStr))
  , [allItems, dateStr])

  const alldayItems = useMemo(() => dayItems.filter(i => !i.scheduled_time), [dayItems])

  const timedItems = useMemo(() => {
    return dayItems
      .filter(i => !!i.scheduled_time)
      .map(i => {
        let duration = 60
        if (i.done && i.completed_at) {
          const startMin = timeToMin(i.scheduled_time)
          const endDate = new Date(i.completed_at)
          const endMin = endDate.getHours() * 60 + endDate.getMinutes()
          const diff = endMin - startMin
          if (diff > 5) duration = diff
        }
        return { ...i, _duration: duration }
      })
  }, [dayItems])

  const nowMin = today.getHours() * 60 + today.getMinutes()

  useEffect(() => {
    if (scrollRef.current) {
      const target = Math.max(0, (nowMin - 90) * PX_PER_MIN)
      scrollRef.current.scrollTop = target
    }
  }, [])

  const placed = useMemo(() => calcColumns(timedItems), [timedItems])

  const prevDay = () => setCurrent(d => new Date(d.getTime() - 86400000))
  const nextDay = () => setCurrent(d => new Date(d.getTime() + 86400000))
  const goToday = () => setCurrent(new Date(today.getFullYear(), today.getMonth(), today.getDate()))

  return (
    <div className="flex flex-col flex-1 min-h-0" style={{ background: '#0d1117' }}>

      {/* 날짜 네비 */}
      <div
        className="flex items-center justify-between px-5 py-2.5 flex-shrink-0"
        style={{ borderBottom: '1px solid #21262d' }}
      >
        <button
          onClick={prevDay}
          className="flex items-center justify-center rounded-lg transition-colors"
          style={{ width: 28, height: 28, background: '#161b22', border: '1px solid #21262d', color: '#8b949e' }}
        >
          <ChevronLeft size={14} />
        </button>

        <div className="flex items-center gap-3">
          <div className="text-center">
            <div className="text-[14px] font-semibold" style={{ color: '#e6edf3', letterSpacing: '-0.02em' }}>
              {current.getFullYear()}년 {MONTH_KO[current.getMonth()]} {current.getDate()}일
            </div>
            <div className="text-[11px] mt-0.5" style={{ color: '#606070' }}>
              {DAY_KO[current.getDay()]}요일
            </div>
          </div>
          <button
            onClick={goToday}
            className="px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors"
            style={{ background: 'rgba(157,143,252,0.1)', border: '1px solid rgba(157,143,252,0.25)', color: '#9d8ffc' }}
          >
            오늘
          </button>
        </div>

        <button
          onClick={nextDay}
          className="flex items-center justify-center rounded-lg transition-colors"
          style={{ width: 28, height: 28, background: '#161b22', border: '1px solid #21262d', color: '#8b949e' }}
        >
          <ChevronRight size={14} />
        </button>
      </div>

      {/* 종일 영역 */}
      <div
        className="flex items-stretch flex-shrink-0"
        style={{ borderBottom: '1px solid #21262d', minHeight: 36 }}
      >
        <div
          className="flex items-center justify-end flex-shrink-0"
          style={{
            width: 56, paddingRight: 10,
            borderRight: '1px solid #21262d',
            fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.06em', color: '#484f58',
          }}
        >
          종일
        </div>
        <div className="flex flex-wrap gap-1 px-2 py-1.5 items-center flex-1">
          {alldayItems.length === 0
            ? <span style={{ fontSize: 11, color: '#2d333b' }}>—</span>
            : alldayItems.map(item => {
                const list = listMap.get(item.list_id)
                const color = list?.color ?? '#9d8ffc'
                return (
                  <button
                    key={item.id}
                    onClick={() => setEditingItem(item)}
                    className="rounded-md transition-opacity hover:opacity-70"
                    style={{
                      padding: '2px 8px',
                      fontSize: 11, fontWeight: 500,
                      background: `${color}22`,
                      border: `1px solid ${color}44`,
                      color,
                      textDecoration: item.done ? 'line-through' : 'none',
                      opacity: item.done ? 0.5 : 1,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    {item.text}
                  </button>
                )
              })
          }
        </div>
      </div>

      {/* 타임라인 스크롤 영역 */}
      <div className="flex-1 overflow-y-auto" ref={scrollRef}>
        <div style={{ height: 1440, display: 'flex', position: 'relative' }}>

          {/* 시간 레이블 열 */}
          <div style={{ width: 56, flexShrink: 0, position: 'relative', borderRight: '1px solid #21262d' }}>
            {Array.from({ length: 25 }, (_, h) => (
              <div
                key={h}
                style={{
                  position: 'absolute',
                  top: h * 60 * PX_PER_MIN,
                  right: 10,
                  transform: 'translateY(-50%)',
                  fontSize: 10, fontWeight: 500,
                  color: '#484f58',
                  whiteSpace: 'nowrap',
                  letterSpacing: '0.02em',
                  userSelect: 'none',
                }}
              >
                {h < 24 ? `${String(h).padStart(2,'0')}:00` : ''}
              </div>
            ))}
          </div>

          {/* 이벤트 영역 */}
          <div style={{ flex: 1, position: 'relative' }}>

            {/* 시간선 */}
            {Array.from({ length: 25 }, (_, h) => (
              <div key={`hl${h}`}>
                <div style={{ position: 'absolute', left: 0, right: 0, top: h * 60 * PX_PER_MIN, height: 1, background: '#161b22', pointerEvents: 'none' }} />
                {h < 24 && (
                  <div style={{ position: 'absolute', left: 0, right: 0, top: (h * 60 + 30) * PX_PER_MIN, height: 1, background: '#0f1318', pointerEvents: 'none' }} />
                )}
              </div>
            ))}

            {/* 현재 시각선 (오늘만) */}
            {isToday && (
              <div style={{ position: 'absolute', left: -56, right: 0, top: nowMin * PX_PER_MIN, height: 2, background: '#7c6af5', pointerEvents: 'none', zIndex: 10 }}>
                <span style={{ position: 'absolute', left: 0, top: -8, fontSize: 10, fontWeight: 700, color: '#9d8ffc', width: 50, textAlign: 'right' }}>
                  {minToTimeStr(nowMin)}
                </span>
                <span style={{ position: 'absolute', left: 56, top: -4, width: 8, height: 8, borderRadius: '50%', background: '#7c6af5', display: 'block' }} />
              </div>
            )}

            {/* 이벤트 블록 */}
            {placed.map(({ ev, col, totalCols }) => {
              const startMin = timeToMin(ev.scheduled_time)
              const topPx = startMin * PX_PER_MIN
              const heightPx = Math.max(ev._duration * PX_PER_MIN - 2, 22)
              const widthPct = 100 / totalCols
              const leftPct = col * widthPct
              const list = listMap.get(ev.list_id)
              const color = list?.color ?? '#9d8ffc'
              const endMin = startMin + ev._duration

              return (
                <button
                  key={ev.id}
                  onClick={() => setEditingItem(ev)}
                  style={{
                    position: 'absolute',
                    top: topPx + 1,
                    height: heightPx,
                    left: `calc(${leftPct}% + 3px)`,
                    width: `calc(${widthPct}% - 6px)`,
                    background: `${color}22`,
                    borderLeft: `3px solid ${color}`,
                    borderRadius: 8,
                    padding: '4px 7px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    opacity: ev.done ? 0.45 : 1,
                    transition: 'filter 150ms',
                    fontFamily: 'inherit',
                    border: 'none',
                    borderLeft: `3px solid ${color}`,
                  }}
                  onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.2)'}
                  onMouseLeave={e => e.currentTarget.style.filter = ''}
                >
                  <div style={{ fontSize: 12, fontWeight: 600, color, lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textDecoration: ev.done ? 'line-through' : 'none' }}>
                    {ev.text}
                  </div>
                  {heightPx > 36 && (
                    <div style={{ fontSize: 10, color, opacity: 0.7, marginTop: 1, whiteSpace: 'nowrap' }}>
                      {ev.scheduled_time.slice(0, 5)} – {minToTimeStr(endMin)}
                    </div>
                  )}
                  {heightPx > 52 && list && (
                    <div style={{ fontSize: 10, color, opacity: 0.55, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {list.title}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* 편집 모달 */}
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
    </div>
  )
}
