# Todo Timeline View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "타임라인" view to the Todo page that shows a single day's items on a vertical time grid with overlap handling.

**Architecture:** Create `src/components/todo/TodoTimeline.jsx` as a self-contained component that receives `lists`, `allItems`, `notes`, `fetchNote`, `onUpdateItem`, `onDeleteItem` — same shape as `TodoCalendar`. Add `'timeline'` to the view toggle in `TodoPage.jsx`.

**Tech Stack:** React 19, Tailwind CSS 4, lucide-react, existing todoApi/useTodos hooks

---

## File Map

| Action | File | Responsibility |
|--------|------|---------------|
| Create | `src/components/todo/TodoTimeline.jsx` | 타임라인 뷰 전체 (날짜 네비, 종일 존, 시간 그리드, 이벤트 블록, 겹침 계산) |
| Modify | `src/pages/TodoPage.jsx` | view state에 `'timeline'` 추가, 뷰 토글 버튼 추가, `<TodoTimeline>` 렌더링 |

---

## Task 1: TodoTimeline 컴포넌트 — 뼈대 + 날짜 네비

**Files:**
- Create: `src/components/todo/TodoTimeline.jsx`

- [ ] **Step 1: 파일 생성 — 뼈대 + 날짜 네비**

`src/components/todo/TodoTimeline.jsx` 를 아래 내용으로 생성:

```jsx
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
    const dur = ev._duration
    const end = start + dur
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

  // 오늘 날짜 항목 분리
  const dayItems = useMemo(() =>
    allItems.filter(i => i.start_date?.startsWith(dateStr))
  , [allItems, dateStr])

  const alldayItems = useMemo(() => dayItems.filter(i => !i.scheduled_time), [dayItems])

  const timedItems = useMemo(() => {
    return dayItems
      .filter(i => !!i.scheduled_time)
      .map(i => {
        // 완료된 경우 실제 소요시간, 아니면 기본 60분
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

  // 현재 시각 (분)
  const nowMin = today.getHours() * 60 + today.getMinutes()

  // 페이지 로드 시 현재 시각 근처로 스크롤
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
          style={{ width: 56, paddingRight: 10, borderRight: '1px solid #21262d', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#484f58' }}
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
                    className="rounded-md transition-opacity hover:opacity-80"
                    style={{
                      padding: '2px 8px',
                      fontSize: 11,
                      fontWeight: 500,
                      background: `${color}22`,
                      border: `1px solid ${color}44`,
                      color,
                      textDecoration: item.done ? 'line-through' : 'none',
                      opacity: item.done ? 0.5 : 1,
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
      <div className="flex-1 overflow-y-auto" ref={scrollRef} style={{ position: 'relative' }}>
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
                  fontSize: 10,
                  color: '#484f58',
                  fontWeight: 500,
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
              <div key={`h${h}`}>
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
                  }}
                  onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.2)'}
                  onMouseLeave={e => e.currentTarget.style.filter = ''}
                >
                  <div style={{ fontSize: 12, fontWeight: 600, color, lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textDecoration: ev.done ? 'line-through' : 'none' }}>
                    {ev.text}
                  </div>
                  {heightPx > 36 && (
                    <div style={{ fontSize: 10, color, opacity: 0.7, marginTop: 1, whiteSpace: 'nowrap' }}>
                      {ev.scheduled_time.slice(0,5)} – {minToTimeStr(endMin)}
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
```

- [ ] **Step 2: 저장 확인**

파일이 생성됐는지 확인:
```bash
ls src/components/todo/TodoTimeline.jsx
```
Expected: 파일 존재

---

## Task 2: TodoPage에 타임라인 뷰 연결

**Files:**
- Modify: `src/pages/TodoPage.jsx`

- [ ] **Step 1: import 추가**

`src/pages/TodoPage.jsx` 상단 import에 추가:
```jsx
import { TodoTimeline } from '../components/todo/TodoTimeline'
```
그리고 `lucide-react` import에 `Timeline` 대신 쓸 아이콘 추가 (lucide에 Timeline 없으므로 `AlignLeft` 사용):
```jsx
import { ArrowLeft, Bell, BellOff, LayoutList, CalendarDays, AlignLeft } from 'lucide-react'
```

- [ ] **Step 2: view 토글에 타임라인 버튼 추가**

기존 뷰 토글 버튼 블록에서 `달력` 버튼 뒤에 추가:
```jsx
<button
  onClick={() => setView('timeline')}
  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] transition-colors"
  style={{ background: view === 'timeline' ? '#21262d' : 'transparent', color: view === 'timeline' ? '#cdd9e5' : '#606070' }}
>
  <AlignLeft size={13} />
  타임라인
</button>
```

- [ ] **Step 3: 타임라인 뷰 렌더링 추가**

`{view === 'calendar' && ...}` 블록 바로 뒤에 추가:
```jsx
{view === 'timeline' && (
  <TodoTimeline
    lists={lists}
    allItems={getAllVisibleItems()}
    notes={notes}
    fetchNote={fetchNote}
    onUpdateItem={updateItem}
    onDeleteItem={deleteItem}
  />
)}
```

- [ ] **Step 4: 개발 서버 실행 후 동작 확인**

```bash
npm run dev
```

체크리스트:
- [ ] 상단 토글에 "타임라인" 버튼 노출
- [ ] 타임라인 클릭 시 시간 그리드 표시
- [ ] ◀▶ 버튼으로 날짜 이동
- [ ] 오늘 버튼 클릭 시 오늘로 복귀
- [ ] `scheduled_time` 없는 항목 → 종일 영역에 표시
- [ ] `scheduled_time` 있는 항목 → 시간 위치에 블록 표시
- [ ] 같은 시간대 항목 → 가로로 나란히 표시 (겹침 처리)
- [ ] 완료된 항목 → 반투명 + 취소선
- [ ] 오늘 뷰 → 보라색 현재 시각선 노출
- [ ] 항목 클릭 → `TodoItemModal` 열림

- [ ] **Step 5: 커밋 + 배포**

```bash
git add src/components/todo/TodoTimeline.jsx src/pages/TodoPage.jsx
git commit -m "feat: Todo 타임라인 뷰 추가"
git push origin main
```
