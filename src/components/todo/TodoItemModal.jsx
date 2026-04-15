import { useState, useEffect } from 'react'
import { X, Flag, Calendar, Tag, FileText } from 'lucide-react'

const PRIORITY_OPTIONS = [
  { value: 1, label: '낮음', color: '#606070' },
  { value: 2, label: '보통', color: '#e3b341' },
  { value: 3, label: '높음', color: '#f78166' },
]

export function TodoItemModal({ item, onClose, onUpdate, onDelete }) {
  const [text, setText] = useState(item.text)
  const [priority, setPriority] = useState(item.priority ?? 1)
  const [dueDate, setDueDate] = useState(item.due_date ? item.due_date.split('T')[0] : '')
  const [tags, setTags] = useState((item.tags ?? []).join(', '))
  const [note, setNote] = useState(item.note ?? '')
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    setDirty(true)
  }, [text, priority, dueDate, tags, note])

  useEffect(() => {
    setDirty(false)
  }, [item.id])

  const handleSave = () => {
    const tagArr = tags.split(',').map(t => t.trim()).filter(Boolean)
    onUpdate(item.id, {
      text: text.trim() || item.text,
      priority,
      due_date: dueDate || null,
      tags: tagArr,
    })
    onClose()
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={e => { if (e.target === e.currentTarget) { if (dirty) handleSave(); else onClose() } }}
    >
      <div
        className="w-full max-w-md rounded-2xl flex flex-col"
        style={{ background: '#0d1117', border: '1px solid #21262d', maxHeight: '80vh' }}
      >
        {/* header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #21262d' }}>
          <span className="text-[13px] font-medium" style={{ color: '#8b949e' }}>항목 편집</span>
          <button onClick={() => { if (dirty) handleSave(); else onClose() }} style={{ color: '#606070' }}>
            <X size={16} />
          </button>
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

          {/* priority */}
          <div>
            <label className="flex items-center gap-1.5 text-[11px] mb-2" style={{ color: '#606070' }}>
              <Flag size={12} /> 우선순위
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

          {/* due date */}
          <div>
            <label className="flex items-center gap-1.5 text-[11px] mb-2" style={{ color: '#606070' }}>
              <Calendar size={12} /> 마감일
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-[13px] outline-none"
              style={{ background: '#161b22', color: '#cdd9e5', border: '1px solid #21262d', colorScheme: 'dark' }}
            />
          </div>

          {/* tags */}
          <div>
            <label className="flex items-center gap-1.5 text-[11px] mb-2" style={{ color: '#606070' }}>
              <Tag size={12} /> 태그 (쉼표로 구분)
            </label>
            <input
              value={tags}
              onChange={e => setTags(e.target.value)}
              placeholder="업무, 중요, ..."
              className="w-full px-3 py-2 rounded-lg text-[13px] outline-none"
              style={{ background: '#161b22', color: '#cdd9e5', border: '1px solid #21262d' }}
            />
          </div>
        </div>

        {/* footer */}
        <div className="flex items-center justify-between px-5 py-3" style={{ borderTop: '1px solid #21262d' }}>
          <button
            onClick={() => { onDelete(item.id); onClose() }}
            className="text-[12px] px-3 py-1.5 rounded-lg transition-colors"
            style={{ color: 'rgb(248,113,113)', background: 'rgba(248,113,113,0.08)' }}
          >
            삭제
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="text-[12px] px-3 py-1.5 rounded-lg transition-colors"
              style={{ color: '#8b949e', background: '#21262d' }}
            >
              취소
            </button>
            <button
              onClick={handleSave}
              className="text-[12px] px-3 py-1.5 rounded-lg transition-colors"
              style={{ background: '#7c6af5', color: '#fff' }}
            >
              저장
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
