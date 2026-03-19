import { useState } from 'react'
import { X } from 'lucide-react'

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
    <div className="flex flex-wrap items-center gap-1.5">
      {tags.map(tag => (
        <span
          key={tag}
          className="group flex items-center gap-1 text-[12px] bg-[#7c6af5]/10 text-[#9880e8] border border-[#7c6af5]/20 px-2.5 py-0.5 rounded-full transition-all duration-150 hover:bg-[#7c6af5]/15"
        >
          #{tag}
          <button
            onClick={() => remove(tag)}
            className="opacity-40 group-hover:opacity-100 hover:text-red-400 transition-all duration-150 leading-none"
          >
            <X size={10} />
          </button>
        </span>
      ))}
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={add}
        placeholder={tags.length === 0 ? '태그 추가...' : ''}
        className="bg-transparent text-[12px] text-[#7070a0] placeholder-[#353545] outline-none min-w-[80px] transition-colors duration-150 focus:text-[#a0a0c0]"
      />
    </div>
  )
}
