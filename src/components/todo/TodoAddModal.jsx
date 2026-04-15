import { useState } from 'react'
import { X, Calendar, Clock, RefreshCw, AlignLeft, Flag, Play } from 'lucide-react'
import { NoteLinkPicker } from './NoteLinkPicker'

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

function nowTimeStr() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

export function TodoAddModal({ notes = [], onClose, onSubmit }) {
  const [text, setText] = useState('')
  const [isAllDay, setIsAllDay] = useState(true)
  const [date, setDate] = useState(todayStr())
  const [startTime, setStartTime] = useState('')
  const [recurrence, setRecurrence] = useState('none')
  const [priority, setPriority] = useState(1)
  const [memo, setMemo] = useState('')
  const [noteIds, setNoteIds] = useState([])

  const handleSubmit = () => {
    if (!text.trim()) return
    onSubmit({
      text: text.trim(),
      priority,
      start_date: date || null,
      scheduled_time: (!isAllDay && startTime) ? startTime : null,
      recurrence,
      memo: memo.trim() || null,
      note_ids: noteIds,
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

          {/* 날짜 + 하루종일 */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              {/* date */}
              <div className="flex-1">
                <label className="flex items-center gap-1 text-[11px] mb-1.5" style={{ color: '#606070' }}>
                  <Calendar size={11} /> 날짜
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-lg text-[12px] outline-none"
                  style={{ background: '#161b22', color: '#cdd9e5', border: '1px solid #21262d', colorScheme: 'dark' }}
                />
              </div>

              {/* 하루종일 toggle */}
              <div className="flex flex-col items-center gap-1 pt-5">
                <button
                  onClick={() => setIsAllDay(v => !v)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors"
                  style={{
                    background: isAllDay ? 'rgba(157,143,252,0.1)' : '#161b22',
                    border: `1px solid ${isAllDay ? 'rgba(157,143,252,0.35)' : '#21262d'}`,
                  }}
                >
                  <div
                    className="w-3.5 h-3.5 rounded flex items-center justify-center flex-shrink-0"
                    style={{
                      background: isAllDay ? '#7c6af5' : 'transparent',
                      border: `2px solid ${isAllDay ? '#7c6af5' : '#484f58'}`,
                    }}
                  >
                    {isAllDay && (
                      <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                        <path d="M1 3L2.8 5L7 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <span className="text-[12px]" style={{ color: isAllDay ? '#9d8ffc' : '#8b949e' }}>하루종일</span>
                </button>
              </div>
            </div>

            {/* 시간 (하루종일 아닐 때) */}
            {!isAllDay && (
              <div>
                <label className="flex items-center gap-1 text-[11px] mb-1.5" style={{ color: '#606070' }}>
                  <Clock size={11} /> 시작 시간
                </label>
                <div className="flex gap-2">
                  <input
                    type="time"
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    className="flex-1 px-2.5 py-2 rounded-lg text-[12px] outline-none"
                    style={{ background: '#161b22', color: '#cdd9e5', border: '1px solid #21262d', colorScheme: 'dark' }}
                  />
                  <button
                    onClick={() => setStartTime(nowTimeStr())}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] transition-colors"
                    style={{ background: 'rgba(86,211,100,0.1)', color: '#56d364', border: '1px solid rgba(86,211,100,0.2)' }}
                    title="지금 시간으로"
                  >
                    <Play size={11} />
                    지금
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 주기 */}
          <div>
            <label className="flex items-center gap-1 text-[11px] mb-1.5" style={{ color: '#606070' }}>
              <RefreshCw size={11} /> 주기
            </label>
            <div className="flex gap-1.5">
              {RECURRENCE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setRecurrence(opt.value)}
                  className="flex-1 py-1.5 rounded-lg text-[12px] transition-colors"
                  style={{
                    background: recurrence === opt.value ? 'rgba(88,166,255,0.12)' : '#161b22',
                    border: `1px solid ${recurrence === opt.value ? '#58a6ff' : '#21262d'}`,
                    color: recurrence === opt.value ? '#58a6ff' : '#606070',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 우선순위 */}
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

          {/* 메모 */}
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

          {/* 노트 연결 */}
          <NoteLinkPicker
            notes={notes}
            selectedNoteIds={noteIds}
            onChange={setNoteIds}
          />
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
