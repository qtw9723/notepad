import { useState } from 'react'
import { X, Flag, Calendar, Clock, RefreshCw, Tag, AlignLeft, Play, Timer } from 'lucide-react'
import { NoteLinkPicker } from './NoteLinkPicker'
import { NotePreviewPanel } from './NotePreviewPanel'

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

const PRIORITY_OPTIONS = [
  { value: 1, label: '낮음', color: '#606070' },
  { value: 2, label: '보통', color: '#e3b341' },
  { value: 3, label: '높음', color: '#f78166' },
]

const RECURRENCE_OPTIONS = [
  { value: 'none',     label: '없음' },
  { value: 'daily',    label: '매일' },
  { value: 'weekdays', label: '주중' },
  { value: 'weekly',   label: '매주' },
  { value: 'monthly',  label: '매달' },
]

function roundedNowTimeStr() {
  const d = new Date()
  const m = Math.round(d.getMinutes() / 10) * 10
  const h = (d.getHours() + (m === 60 ? 1 : 0)) % 24
  return `${String(h).padStart(2,'0')}:${String(m % 60).padStart(2,'0')}`
}

function addHour(timeStr) {
  const [h, m] = timeStr.split(':').map(Number)
  return `${String((h + 1) % 24).padStart(2,'0')}:${String(m).padStart(2,'0')}`
}

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

// ISO → HH:MM
function toTimeInput(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

// date str + HH:MM → ISO string
function combineDateTime(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null
  return new Date(`${dateStr}T${timeStr}:00`).toISOString()
}

export function TodoItemModal({ item, notes = [], fetchNote, onClose, onUpdate, onDelete }) {
  const [text, setText] = useState(item.text)
  const [priority, setPriority] = useState(item.priority ?? 1)
  const [date, setDate] = useState(item.start_date ?? todayStr())
  const [isAllDay, setIsAllDay] = useState(!item.scheduled_time)
  const [startTime, setStartTime] = useState(item.scheduled_time ? item.scheduled_time.slice(0,5) : '')
  const [endTime, setEndTime] = useState(item.end_time ? item.end_time.slice(0,5) : '')
  const [endDate, setEndDate] = useState(item.end_date ?? '')
  const [recurrence, setRecurrence] = useState(item.recurrence ?? 'none')
  const [tags, setTags] = useState((item.tags ?? []).join(', '))
  const [memo, setMemo] = useState(item.memo ?? '')
  const [previewNote, setPreviewNote] = useState(null)
  const [noteIds, setNoteIds] = useState(() => {
    if (item.note_ids?.length) return item.note_ids
    if (item.note_id) return [item.note_id]
    return []
  })
  // 완료 시간
  const [completedTime, setCompletedTime] = useState(
    item.done && item.completed_at ? toTimeInput(item.completed_at) : roundedNowTimeStr()
  )
  const [completedDate, setCompletedDate] = useState(
    item.done && item.completed_at
      ? new Date(item.completed_at).toISOString().split('T')[0]
      : todayStr()
  )

  const duration = item.done ? calcDuration(item, completedDate, completedTime) : null

  const handleSave = () => {
    const tagArr = tags.split(',').map(t => t.trim()).filter(Boolean)
    const changes = {
      text: text.trim() || item.text,
      priority,
      start_date: date || null,
      scheduled_time: (!isAllDay && startTime) ? startTime : null,
      end_time: (!isAllDay && endTime) ? endTime : null,
      end_date: (!isAllDay && endDate) ? endDate : null,
      recurrence,
      tags: tagArr,
      memo: memo.trim() || null,
      note_ids: noteIds,
    }
    if (item.done) {
      changes.completed_at = combineDateTime(completedDate, completedTime)
    }
    onUpdate(item.id, changes)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={e => { if (e.target === e.currentTarget) handleSave() }}
    >
      <div
        className="w-full max-w-md rounded-2xl flex flex-col"
        style={{ background: '#0d1117', border: '1px solid #21262d', maxHeight: '90vh' }}
      >
        {/* header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #21262d' }}>
          <span className="text-[13px] font-medium" style={{ color: '#8b949e' }}>항목 편집</span>
          <button onClick={handleSave} style={{ color: '#606070' }}><X size={16} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">

          {/* text */}
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            rows={2}
            className="w-full resize-none rounded-lg px-3 py-2.5 text-[14px] outline-none"
            style={{ background: '#161b22', color: '#e6edf3', border: '1px solid #21262d', lineHeight: 1.6 }}
          />

          {/* 날짜 + 하루종일 */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
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
              <div className="flex flex-col items-center gap-1 pt-5">
                <button
                  onClick={() => {
                    const next = !isAllDay
                    setIsAllDay(next)
                    if (next === false && !startTime) {
                      const now = roundedNowTimeStr()
                      setStartTime(now)
                      if (!endTime) setEndTime(addHour(now))
                      if (!endDate) setEndDate(date)
                    }
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors"
                  style={{
                    background: isAllDay ? 'rgba(157,143,252,0.1)' : '#161b22',
                    border: `1px solid ${isAllDay ? 'rgba(157,143,252,0.35)' : '#21262d'}`,
                  }}
                >
                  <div
                    className="w-3.5 h-3.5 rounded flex items-center justify-center"
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

            {/* 시작/종료 시간 */}
            {!isAllDay && (() => {
              const sH = startTime ? parseInt(startTime.split(':')[0]) : 9
              const sM = startTime ? parseInt(startTime.split(':')[1]) : 0
              const eH = endTime   ? parseInt(endTime.split(':')[0])   : 10
              const eM = endTime   ? parseInt(endTime.split(':')[1])   : 0
              const setStartH = h => setStartTime(`${String(h).padStart(2,'0')}:${String(sM).padStart(2,'0')}`)
              const setStartM = m => setStartTime(`${String(sH).padStart(2,'0')}:${String(m).padStart(2,'0')}`)
              const setEndH   = h => setEndTime(`${String(h).padStart(2,'0')}:${String(eM).padStart(2,'0')}`)
              const setEndM   = m => setEndTime(`${String(eH).padStart(2,'0')}:${String(m).padStart(2,'0')}`)
              const selectSt = { background: '#161b22', color: '#cdd9e5', border: '1px solid #21262d', colorScheme: 'dark', minWidth: 64 }
              const minBtn = (active) => ({
                background: active ? 'rgba(157,143,252,0.15)' : '#161b22',
                border: `1px solid ${active ? 'rgba(157,143,252,0.4)' : '#21262d'}`,
                color: active ? '#9d8ffc' : '#606070',
              })
              return (
                <div className="flex flex-col gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="flex items-center gap-1 text-[11px]" style={{ color: '#606070' }}>
                        <Clock size={11} /> 시작 시간
                      </label>
                      <button onClick={() => { const now = roundedNowTimeStr(); setStartTime(now); if (!endTime) setEndTime(addHour(now)) }} className="flex items-center gap-1 text-[11px]" style={{ color: '#56d364' }}>
                        <Play size={10} /> 지금
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <select value={sH} onChange={e => setStartH(Number(e.target.value))} className="px-2 py-2 rounded-lg text-[13px] outline-none" style={selectSt}>
                        {Array.from({ length: 24 }, (_, i) => <option key={i} value={i}>{String(i).padStart(2,'0')}시</option>)}
                      </select>
                      <div className="flex gap-1 flex-1">
                        {[0,10,20,30,40,50].map(m => (
                          <button key={m} onClick={() => setStartM(m)} className="flex-1 py-2 rounded-lg text-[12px] transition-colors" style={minBtn(sM === m)}>
                            {String(m).padStart(2,'0')}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="flex items-center gap-1 text-[11px] mb-1.5" style={{ color: '#606070' }}>
                      <Clock size={11} /> 종료 일시
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={e => setEndDate(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-lg text-[12px] outline-none mb-2"
                      style={{ background: '#161b22', color: '#cdd9e5', border: '1px solid #21262d', colorScheme: 'dark' }}
                    />
                    <div className="flex items-center gap-2">
                      <select value={eH} onChange={e => setEndH(Number(e.target.value))} className="px-2 py-2 rounded-lg text-[13px] outline-none" style={selectSt}>
                        {Array.from({ length: 24 }, (_, i) => <option key={i} value={i}>{String(i).padStart(2,'0')}시</option>)}
                      </select>
                      <div className="flex gap-1 flex-1">
                        {[0,10,20,30,40,50].map(m => (
                          <button key={m} onClick={() => setEndM(m)} className="flex-1 py-2 rounded-lg text-[12px] transition-colors" style={minBtn(eM === m)}>
                            {String(m).padStart(2,'0')}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>

          {/* 완료 시간 (done 항목만) */}
          {item.done && (() => {
            const cH = completedTime ? parseInt(completedTime.split(':')[0]) : 0
            const cM = completedTime ? parseInt(completedTime.split(':')[1]) : 0
            const setCH = h => setCompletedTime(`${String(h).padStart(2,'0')}:${String(cM).padStart(2,'0')}`)
            const setCM = m => setCompletedTime(`${String(cH).padStart(2,'0')}:${String(m).padStart(2,'0')}`)
            const minBtn = (active) => ({
              background: active ? 'rgba(86,211,100,0.12)' : '#161b22',
              border: `1px solid ${active ? 'rgba(86,211,100,0.35)' : '#21262d'}`,
              color: active ? '#56d364' : '#606070',
            })
            return (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="flex items-center gap-1 text-[11px]" style={{ color: '#56d364' }}>
                    <Clock size={11} /> 완료 시간
                  </label>
                  <button onClick={() => { setCompletedDate(todayStr()); setCompletedTime(roundedNowTimeStr()) }} className="flex items-center gap-1 text-[11px]" style={{ color: '#56d364' }}>
                    <Play size={10} /> 지금
                  </button>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="date"
                    value={completedDate}
                    onChange={e => setCompletedDate(e.target.value)}
                    className="px-2.5 py-2 rounded-lg text-[12px] outline-none"
                    style={{ background: '#161b22', color: '#cdd9e5', border: '1px solid rgba(86,211,100,0.2)', colorScheme: 'dark' }}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <select value={cH} onChange={e => setCH(Number(e.target.value))} className="px-2 py-2 rounded-lg text-[13px] outline-none" style={{ background: '#161b22', color: '#56d364', border: '1px solid rgba(86,211,100,0.25)', colorScheme: 'dark', minWidth: 64 }}>
                    {Array.from({ length: 24 }, (_, i) => <option key={i} value={i}>{String(i).padStart(2,'0')}시</option>)}
                  </select>
                  <div className="flex gap-1 flex-1">
                    {[0,10,20,30,40,50].map(m => (
                      <button key={m} onClick={() => setCM(m)} className="flex-1 py-2 rounded-lg text-[12px] transition-colors" style={minBtn(cM === m)}>
                        {String(m).padStart(2,'0')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )
          })()}

          {/* 수행 시간 (완료 항목) */}
          {duration && (
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-[12px]"
              style={{ background: 'rgba(157,143,252,0.07)', border: '1px solid rgba(157,143,252,0.15)' }}
            >
              <Timer size={12} style={{ color: '#9d8ffc' }} />
              <span style={{ color: '#8b949e' }}>수행 시간</span>
              <span style={{ color: '#9d8ffc', fontWeight: 550 }}>{duration}</span>
            </div>
          )}

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

          {/* 태그 */}
          <div>
            <label className="flex items-center gap-1 text-[11px] mb-1.5" style={{ color: '#606070' }}>
              <Tag size={11} /> 태그
            </label>
            <input
              value={tags}
              onChange={e => setTags(e.target.value)}
              placeholder="업무, 중요, ..."
              className="w-full px-3 py-2 rounded-lg text-[13px] outline-none"
              style={{ background: '#161b22', color: '#cdd9e5', border: '1px solid #21262d' }}
            />
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
            onPreview={fetchNote ? (note) => setPreviewNote(note) : undefined}
          />
        </div>

        {/* footer */}
        <div className="flex items-center justify-between px-5 py-3" style={{ borderTop: '1px solid #21262d' }}>
          <button
            onClick={() => { onDelete(item.id); onClose() }}
            className="text-[12px] px-3 py-1.5 rounded-lg"
            style={{ color: 'rgb(248,113,113)', background: 'rgba(248,113,113,0.08)' }}
          >
            삭제
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="text-[12px] px-3 py-1.5 rounded-lg"
              style={{ color: '#8b949e', background: '#21262d' }}
            >
              취소
            </button>
            <button
              onClick={handleSave}
              className="text-[12px] px-3 py-1.5 rounded-lg"
              style={{ background: '#7c6af5', color: '#fff' }}
            >
              저장
            </button>
          </div>
        </div>
      </div>

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
