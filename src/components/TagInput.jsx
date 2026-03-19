import { useState } from 'react'
import { X, Plus } from 'lucide-react'

export default function TagInput({ tags, onChange }) {
  const [input, setInput] = useState('')

  const add = () => {
    const val = input.trim().toLowerCase()
    if (val && !tags.includes(val)) {
      onChange([...tags, val])
    }
    setInput('')
  }

  const remove = (tag) => onChange(tags.filter(t => t !== tag))

  const onKeyDown = (e) => {
    if (e.isComposing) return
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      add()
    } else if (e.key === 'Backspace' && !input && tags.length) {
      remove(tags[tags.length - 1])
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 min-h-[32px]">
      {tags.map(tag => (
        <span
          key={tag}
          className="flex items-center gap-1 text-xs bg-[#7c6af5]/15 text-[#a990ff] border border-[#7c6af5]/30 px-2 py-0.5 rounded-full"
        >
          #{tag}
          <button onClick={() => remove(tag)} className="hover:text-red-400 transition-colors">
            <X size={10} />
          </button>
        </span>
      ))}
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={add}
        placeholder={tags.length === 0 ? "태그 추가 (Enter)..." : ""}
        className="bg-transparent text-xs text-[#a0a0b0] placeholder-[#404050] outline-none min-w-[100px]"
      />
    </div>
  )
}
