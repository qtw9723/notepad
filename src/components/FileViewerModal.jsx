import { useState, useRef, useEffect } from 'react'
import { X, Download } from 'lucide-react'

const OFFICE_EXTS = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx']
const DEFAULT_W = 860, DEFAULT_H = 560
const MIN_W = 360, MIN_H = 260
const E = 6  // 리사이즈 핸들 두께

function formatFileSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

// 8방향 리사이즈 핸들 정의
const HANDLES = [
  { dir: 'n',  style: { top: -E, left: E*2, right: E*2, height: E*2, cursor: 'n-resize' } },
  { dir: 's',  style: { bottom: -E, left: E*2, right: E*2, height: E*2, cursor: 's-resize' } },
  { dir: 'e',  style: { right: -E, top: E*2, bottom: E*2, width: E*2, cursor: 'e-resize' } },
  { dir: 'w',  style: { left: -E, top: E*2, bottom: E*2, width: E*2, cursor: 'w-resize' } },
  { dir: 'ne', style: { top: -E, right: -E, width: E*4, height: E*4, cursor: 'ne-resize' } },
  { dir: 'nw', style: { top: -E, left: -E, width: E*4, height: E*4, cursor: 'nw-resize' } },
  { dir: 'se', style: { bottom: -E, right: -E, width: E*4, height: E*4, cursor: 'se-resize' } },
  { dir: 'sw', style: { bottom: -E, left: -E, width: E*4, height: E*4, cursor: 'sw-resize' } },
]

export default function FileViewerModal({ file, onClose }) {
  const [pos, setPos] = useState(() => ({
    x: Math.max(20, (window.innerWidth - DEFAULT_W) / 2),
    y: Math.max(20, (window.innerHeight - DEFAULT_H) / 2),
  }))
  const [size, setSize] = useState({ w: DEFAULT_W, h: DEFAULT_H })
  const [blocking, setBlocking] = useState(false)

  // 최신 pos/size를 이벤트 핸들러에서 stale closure 없이 참조
  const posRef = useRef(pos)
  const sizeRef = useRef(size)
  posRef.current = pos
  sizeRef.current = size

  const dragRef = useRef(null)
  const resizeRef = useRef(null)

  useEffect(() => {
    const onMove = (e) => {
      if (dragRef.current) {
        const dx = e.clientX - dragRef.current.startX
        const dy = e.clientY - dragRef.current.startY
        setPos({
          x: Math.max(0, dragRef.current.posX + dx),
          y: Math.max(0, dragRef.current.posY + dy),
        })
      }
      if (resizeRef.current) {
        const { startX, startY, startW, startH, posX, posY, dir } = resizeRef.current
        const dx = e.clientX - startX
        const dy = e.clientY - startY
        let w = startW, h = startH, x = posX, y = posY
        if (dir.includes('e')) w = Math.max(MIN_W, startW + dx)
        if (dir.includes('w')) { w = Math.max(MIN_W, startW - dx); x = posX + startW - w }
        if (dir.includes('s')) h = Math.max(MIN_H, startH + dy)
        if (dir.includes('n')) { h = Math.max(MIN_H, startH - dy); y = posY + startH - h }
        setSize({ w, h })
        setPos({ x, y })
      }
    }
    const onUp = () => {
      dragRef.current = null
      resizeRef.current = null
      setBlocking(false)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [])

  const startDrag = (e) => {
    if (e.button !== 0) return
    e.preventDefault()
    dragRef.current = { startX: e.clientX, startY: e.clientY, posX: posRef.current.x, posY: posRef.current.y }
    setBlocking(true)
  }

  const startResize = (e, dir) => {
    if (e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()
    resizeRef.current = {
      startX: e.clientX, startY: e.clientY,
      startW: sizeRef.current.w, startH: sizeRef.current.h,
      posX: posRef.current.x, posY: posRef.current.y,
      dir,
    }
    setBlocking(true)
  }

  const ext = file.name.split('.').pop().toLowerCase()
  const isPdf = ext === 'pdf'
  const isOffice = OFFICE_EXTS.includes(ext)
  const viewerUrl = isPdf
    ? file.url
    : isOffice
      ? `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(file.url)}`
      : null

  return (
    <div
      style={{ left: pos.x, top: pos.y, width: size.w, height: size.h }}
      className="fixed z-50 flex flex-col bg-[#0d1117] border border-[#21262d] rounded-xl shadow-2xl"
    >
      {/* 8방향 리사이즈 핸들 */}
      {HANDLES.map(({ dir, style }) => (
        <div
          key={dir}
          style={{ position: 'absolute', ...style }}
          onPointerDown={e => startResize(e, dir)}
        />
      ))}

      {/* 헤더 — 드래그 영역 */}
      <div
        className="relative z-10 flex items-center gap-3 px-4 py-2.5 border-b border-[#21262d] bg-[#161b22] rounded-t-xl shrink-0 select-none"
        style={{ cursor: 'move' }}
        onPointerDown={startDrag}
      >
        <span className="text-[13px] font-medium text-[#e6edf3] truncate flex-1">{file.name}</span>
        {file.size && (
          <span className="text-[11px] text-[#484f58] shrink-0">{formatFileSize(file.size)}</span>
        )}
        <a
          href={file.url}
          download={file.name}
          onPointerDown={e => e.stopPropagation()}
          className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-md border border-[#21262d] text-[#8b949e] hover:text-[#cdd9e5] hover:border-[#8b949e] transition-colors shrink-0"
        >
          <Download size={11} />
          다운로드
        </a>
        <button
          onPointerDown={e => e.stopPropagation()}
          onClick={onClose}
          className="text-[#8b949e] hover:text-[#cdd9e5] transition-colors shrink-0"
        >
          <X size={14} />
        </button>
      </div>

      {/* 뷰어 */}
      <div className="flex-1 relative overflow-hidden rounded-b-xl min-h-0">
        {viewerUrl ? (
          <iframe
            src={viewerUrl}
            className="w-full h-full border-0"
            title={file.name}
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 h-full">
            <p className="text-[13px] text-[#8b949e]">미리보기를 지원하지 않는 형식입니다.</p>
            <a
              href={file.url}
              download={file.name}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#9d8ffc] text-[#0d0d10] text-[13px] font-semibold hover:bg-[#b8aeff] transition-colors"
            >
              <Download size={14} />
              다운로드
            </a>
          </div>
        )}
        {/* 드래그·리사이즈 중 iframe 이벤트 차단 */}
        {blocking && <div className="absolute inset-0" />}
      </div>
    </div>
  )
}
