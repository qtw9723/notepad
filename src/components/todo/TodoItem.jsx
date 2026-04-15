import { useState } from 'react'
import { Trash2, Calendar, Flag, Clock, RefreshCw, ChevronRight } from 'lucide-react'

const PRIORITY_COLOR = { 1: '#606070', 2: '#e3b341', 3: '#f78166' }
const PRIORITY_LABEL = { 1: '낮음', 2: '보통', 3: '높음' }
const RECURRENCE_LABEL = { daily: '매일', weekdays: '주중', weekly: '매주', monthly: '매달' }

function formatDate(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr + 'T00:00:00')
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const diff = Math.floor((d - now) / 86400000)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return { label: `${mm}/${dd}`, overdue: diff < 0, today: diff === 0 }
}

function formatTime(timeStr) {
  if (!timeStr) return null
  return timeStr.slice(0, 5) // HH:MM
}

export function TodoItem({ item, onUpdate, onDelete, onClick }) {
  const [hovering, setHovering] = useState(false)

  const due = formatDate(item.due_date)
  const time = formatTime(item.scheduled_time)
  const priorityColor = PRIORITY_COLOR[item.priority ?? 1]
  const recurrenceLabel = RECURRENCE_LABEL[item.recurrence]

  return (
    <div
      className="group flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors"
      style={{
        background: hovering ? 'rgba(255,255,255,0.02)' : 'transparent',
        borderBottom: '1px solid rgba(33,38,45,0.5)',
        opacity: item.done ? 0.45 : 1,
      }}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onClick={() => onClick?.(item)}
    >
      {/* checkbox */}
      <button
        onClick={e => { e.stopPropagation(); onUpdate(item.id, { done: !item.done }) }}
        className="flex-shrink-0 mt-0.5 w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center transition-colors"
        style={{
          borderColor: item.done ? '#7c6af5' : '#484f58',
          background: item.done ? '#7c6af5' : 'transparent',
        }}
      >
        {item.done && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {/* content */}
      <div className="flex-1 min-w-0">
        <p
          className="text-[14px] leading-snug"
          style={{
            color: item.done ? '#606070' : '#cdd9e5',
            textDecoration: item.done ? 'line-through' : 'none',
            fontWeight: 450,
          }}
        >
          {item.text}
        </p>

        {/* meta row */}
        <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-1">
          {/* time */}
          {time && (
            <span className="flex items-center gap-0.5 text-[11px]" style={{ color: '#9d8ffc' }}>
              <Clock size={10} />
              {time}
            </span>
          )}
          {/* priority */}
          {item.priority > 1 && (
            <span className="flex items-center gap-0.5 text-[11px]" style={{ color: priorityColor }}>
              <Flag size={10} />
              {PRIORITY_LABEL[item.priority]}
            </span>
          )}
          {/* due date */}
          {due && (
            <span
              className="flex items-center gap-0.5 text-[11px]"
              style={{ color: due.overdue ? 'rgb(248,113,113)' : due.today ? '#56d364' : '#8b949e' }}
            >
              <Calendar size={10} />
              {due.today ? '오늘' : due.label}
              {due.overdue && ' 지남'}
            </span>
          )}
          {/* recurrence */}
          {recurrenceLabel && (
            <span className="flex items-center gap-0.5 text-[11px]" style={{ color: '#58a6ff' }}>
              <RefreshCw size={9} />
              {recurrenceLabel}
            </span>
          )}
          {/* tags */}
          {item.tags?.map(tag => (
            <span
              key={tag}
              className="text-[10px] px-1.5 py-0.5 rounded-full"
              style={{ background: '#21262d', color: '#8b949e' }}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* memo preview */}
        {item.memo && !item.done && (
          <p className="mt-1 text-[12px] truncate" style={{ color: '#484f58' }}>{item.memo}</p>
        )}
      </div>

      {/* actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <ChevronRight size={14} style={{ color: '#484f58' }} />
        <button
          onClick={e => { e.stopPropagation(); onDelete(item.id) }}
          className="p-1 rounded transition-colors hover:text-red-400"
          style={{ color: '#484f58' }}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )
}
