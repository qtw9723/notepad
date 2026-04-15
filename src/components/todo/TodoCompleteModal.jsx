import { useState } from 'react'
import { X, Clock, AlignLeft, Play } from 'lucide-react'

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}
function nowTimeStr() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}
function calcDuration(item, completedDate, completedTime) {
  if (!item.scheduled_time || !item.start_date || !completedTime || !completedDate) return null
  const start = new Date(`${item.start_date}T${item.scheduled_time}`)
  const end = new Date(`${completedDate}T${completedTime}:00`)
  const mins = Math.round((end - start) / 60000)
  if (mins <= 0) return null
  if (mins < 60) return `${mins}분`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h}시간 ${m}분` : `${h}시간`
}

export function TodoCompleteModal({ item, onConfirm, onCancel }) {
  const [completedDate, setCompletedDate] = useState(todayStr())
  const [completedTime, setCompletedTime] = useState(nowTimeStr())
  const [memo, setMemo] = useState(item.memo ?? '')

  const duration = calcDuration(item, completedDate, completedTime)

  const handleConfirm = () => {
    const completedAt = new Date(`${completedDate}T${completedTime}:00`).toISOString()
    onConfirm({ done: true, completed_at: completedAt, memo: memo.trim() || null })
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: 'rgba(0,0,0,0.65)' }}
      onClick={e => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div
        className="w-full max-w-sm rounded-2xl flex flex-col"
        style={{ background: '#0d1117', border: '1px solid #21262d' }}
      >
        {/* header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #21262d' }}>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-[#7c6af5] flex items-center justify-center">
              <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                <path d="M1 3.5L3.2 5.5L8 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-[14px] font-semibold" style={{ color: '#e6edf3' }}>완료 기록</span>
          </div>
          <button onClick={onCancel} style={{ color: '#606070' }}><X size={16} /></button>
        </div>

        <div className="px-5 py-4 flex flex-col gap-4">
          {/* item text */}
          <p className="text-[13px] px-3 py-2 rounded-lg" style={{ background: '#161b22', color: '#8b949e', border: '1px solid #21262d' }}>
            {item.text}
          </p>

          {/* 완료 시간 */}
          <div>
            <label className="flex items-center gap-1 text-[11px] mb-1.5" style={{ color: '#606070' }}>
              <Clock size={11} /> 완료 시간
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={completedDate}
                onChange={e => setCompletedDate(e.target.value)}
                className="px-2.5 py-2 rounded-lg text-[12px] outline-none"
                style={{ background: '#161b22', color: '#cdd9e5', border: '1px solid rgba(86,211,100,0.2)', colorScheme: 'dark' }}
              />
              <input
                type="time"
                value={completedTime}
                onChange={e => setCompletedTime(e.target.value)}
                className="flex-1 px-2.5 py-2 rounded-lg text-[12px] outline-none"
                style={{ background: '#161b22', color: '#56d364', border: '1px solid rgba(86,211,100,0.2)', colorScheme: 'dark' }}
              />
              <button
                onClick={() => { setCompletedDate(todayStr()); setCompletedTime(nowTimeStr()) }}
                className="flex items-center gap-1 px-2.5 py-2 rounded-lg text-[12px]"
                style={{ background: 'rgba(86,211,100,0.1)', color: '#56d364', border: '1px solid rgba(86,211,100,0.2)' }}
                title="현재 시간"
              >
                <Play size={10} />
              </button>
            </div>
          </div>

          {/* 수행 시간 표시 */}
          {duration && (
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-[12px]"
              style={{ background: 'rgba(157,143,252,0.07)', border: '1px solid rgba(157,143,252,0.15)' }}
            >
              <Clock size={12} style={{ color: '#9d8ffc' }} />
              <span style={{ color: '#8b949e' }}>수행 시간</span>
              <span style={{ color: '#9d8ffc', fontWeight: 550 }}>{duration}</span>
            </div>
          )}

          {/* 메모 */}
          <div>
            <label className="flex items-center gap-1 text-[11px] mb-1.5" style={{ color: '#606070' }}>
              <AlignLeft size={11} /> 완료 메모 (선택)
            </label>
            <textarea
              autoFocus
              value={memo}
              onChange={e => setMemo(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleConfirm() }}
              rows={3}
              placeholder="완료 후 메모..."
              className="w-full resize-none rounded-lg px-3 py-2 text-[13px] outline-none"
              style={{ background: '#161b22', color: '#cdd9e5', border: '1px solid #21262d', lineHeight: 1.7 }}
            />
          </div>
        </div>

        {/* footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3" style={{ borderTop: '1px solid #21262d' }}>
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-[13px]"
            style={{ background: '#21262d', color: '#8b949e' }}
          >
            취소
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 rounded-lg text-[13px] font-medium"
            style={{ background: '#7c6af5', color: '#fff' }}
          >
            완료 확인
          </button>
        </div>
      </div>
    </div>
  )
}
