import { useState, useEffect } from 'react'
import { X, Calendar, Clock, RefreshCw, AlignLeft, Flag } from 'lucide-react'

const RECURRENCE_OPTIONS = [
  { value: 'none',     label: '없음' },
  { value: 'daily',    label: '매일' },
  { value: 'weekdays', label: '주중' },
  { value: 'weekly',   label: '매주' },
  { value: 'monthly',  label: '매달' },
]

const PRIORITY_OPTIONS = [
  { value: 1, label: '낮음', color: '#606070' },
  { value: 2, label: '보통', color: '#e3b341' },
  { value: 3, label: '높음', color: '#f78166' },
]

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

export function TodoAddModal({ onClose, onSubmit }) {
  const [text, setText] = useState('')
  const [isToday, setIsToday] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [recurrence, setRecurrence] = useState('none')
  const [priority, setPriority] = useState(1)
  const [memo, setMemo] = useState('')

  useEffect(() => {
    if (isToday) {
      const t = todayStr()
      setStartDate(t)
      setDueDate(t)
    }
  }, [isToday])

  const handleSubmit = () => {
    if (!text.trim()) return
    onSubmit({
      text: text.trim(),
      priority,
      start_date: startDate || null,
      due_date: dueDate || null,
      scheduled_time: scheduledTime || null,
      recurrence,
      memo: memo.trim() || null,
    })
    onClose()
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-md rounded-2xl flex flex-col"
        style={{ background: '#0d1117', border: '1px solid #21262d', maxHeight: '90vh' }}
      >
        {/* header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #21262d' }}>
          <span className="text-[14px] font-semibold" style={{ color: '#e6edf3' }}>새 항목 추가</span>
          <button onClick={onClose} style={{ color: '#606070' }}><X size={16} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">

          {/* text */}
          <textarea
            autoFocus
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit() }}
            rows={2}
            placeholder="할 일을 입력하세요..."
            className="w-full resize-none rounded-lg px-3 py-2.5 text-[14px] outline-none"
            style={{ background: '#161b22', color: '#e6edf3', border: '1px solid rgba(157,143,252,0.3)', lineHeight: 1.6 }}
          />

          {/* 당일 toggle */}
          <button
            onClick={() => setIsToday(v => !v)}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-colors w-full text-left"
            style={{
              background: isToday ? 'rgba(157,143,252,0.1)' : '#161b22',
              border: `1px solid ${isToday ? 'rgba(157,143,252,0.4)' : '#21262d'}`,
            }}
          >
            <div
              className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
              style={{
                background: isToday ? '#7c6af5' : 'transparent',
                border: `2px solid ${isToday ? '#7c6af5' : '#484f58'}`,
              }}
            >
              {isToday && (
                <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                  <path d="M1 3.5L3.2 5.5L8 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <span className="text-[13px]" style={{ color: isToday ? '#9d8ffc' : '#8b949e', fontWeight: isToday ? 550 : 400 }}>
              당일 — 오늘({todayStr().slice(5).replace('-','/')}) 할 일
            </span>
          </button>

          {/* dates row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="flex items-center gap-1 text-[11px] mb-1.5" style={{ color: '#606070' }}>
                <Calendar size={11} /> 시작일
              </label>
              <input
                type="date"
                value={startDate}
                onChange={e => { setStartDate(e.target.value); setIsToday(false) }}
                disabled={isToday}
                className="w-full px-2.5 py-2 rounded-lg text-[12px] outline-none"
                style={{
                  background: '#161b22',
                  color: isToday ? '#484f58' : '#cdd9e5',
                  border: '1px solid #21262d',
                  colorScheme: 'dark',
                  opacity: isToday ? 0.5 : 1,
                }}
              />
            </div>
            <div>
              <label className="flex items-center gap-1 text-[11px] mb-1.5" style={{ color: '#606070' }}>
                <Calendar size={11} /> 마감일
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={e => { setDueDate(e.target.value); setIsToday(false) }}
                disabled={isToday}
                className="w-full px-2.5 py-2 rounded-lg text-[12px] outline-none"
                style={{
                  background: '#161b22',
                  color: isToday ? '#484f58' : '#cdd9e5',
                  border: '1px solid #21262d',
                  colorScheme: 'dark',
                  opacity: isToday ? 0.5 : 1,
                }}
              />
            </div>
          </div>

          {/* time + recurrence row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="flex items-center gap-1 text-[11px] mb-1.5" style={{ color: '#606070' }}>
                <Clock size={11} /> 시간
              </label>
              <input
                type="time"
                value={scheduledTime}
                onChange={e => setScheduledTime(e.target.value)}
                className="w-full px-2.5 py-2 rounded-lg text-[12px] outline-none"
                style={{ background: '#161b22', color: '#cdd9e5', border: '1px solid #21262d', colorScheme: 'dark' }}
              />
            </div>
            <div>
              <label className="flex items-center gap-1 text-[11px] mb-1.5" style={{ color: '#606070' }}>
                <RefreshCw size={11} /> 주기
              </label>
              <select
                value={recurrence}
                onChange={e => setRecurrence(e.target.value)}
                className="w-full px-2.5 py-2 rounded-lg text-[12px] outline-none"
                style={{ background: '#161b22', color: '#cdd9e5', border: '1px solid #21262d', colorScheme: 'dark' }}
              >
                {RECURRENCE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* priority */}
          <div>
            <label className="flex items-center gap-1 text-[11px] mb-1.5" style={{ color: '#606070' }}>
              <Flag size={11} /> 우선순위
            </label>
            <div className="flex gap-2">
              {PRIORITY_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setPriority(opt.value)}
                  className="flex-1 py-1.5 rounded-lg text-[12px] transition-colors"
                  style={{
                    background: priority === opt.value ? `${opt.color}20` : '#161b22',
                    border: `1px solid ${priority === opt.value ? opt.color : '#21262d'}`,
                    color: priority === opt.value ? opt.color : '#8b949e',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* memo */}
          <div>
            <label className="flex items-center gap-1 text-[11px] mb-1.5" style={{ color: '#606070' }}>
              <AlignLeft size={11} /> 메모
            </label>
            <textarea
              value={memo}
              onChange={e => setMemo(e.target.value)}
              rows={3}
              placeholder="추가 메모..."
              className="w-full resize-none rounded-lg px-3 py-2 text-[13px] outline-none"
              style={{ background: '#161b22', color: '#cdd9e5', border: '1px solid #21262d', lineHeight: 1.7 }}
            />
          </div>
        </div>

        {/* footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3" style={{ borderTop: '1px solid #21262d' }}>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-[13px]"
            style={{ background: '#21262d', color: '#8b949e' }}
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={!text.trim()}
            className="px-4 py-2 rounded-lg text-[13px] font-medium transition-colors"
            style={{
              background: text.trim() ? '#7c6af5' : '#21262d',
              color: text.trim() ? '#fff' : '#484f58',
            }}
          >
            추가 (⌘↵)
          </button>
        </div>
      </div>
    </div>
  )
}
