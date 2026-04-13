import { X, Download } from 'lucide-react'

const OFFICE_EXTS = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx']

function formatFileSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

export default function FileViewerModal({ file, onClose }) {
  const ext = file.name.split('.').pop().toLowerCase()
  const isPdf = ext === 'pdf'
  const isOffice = OFFICE_EXTS.includes(ext)

  const viewerUrl = isPdf
    ? file.url
    : isOffice
      ? `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(file.url)}`
      : null

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0d1117]">
      {/* 헤더 */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-[#21262d] bg-[#161b22] shrink-0">
        <span className="text-[13px] font-medium text-[#e6edf3] truncate flex-1">{file.name}</span>
        {file.size && (
          <span className="text-[12px] text-[#484f58] shrink-0">{formatFileSize(file.size)}</span>
        )}
        <a
          href={file.url}
          download={file.name}
          className="flex items-center gap-1 text-[12px] px-3 py-1.5 rounded-lg bg-[#161b22] border border-[#21262d] text-[#8b949e] hover:text-[#cdd9e5] hover:border-[#8b949e] transition-colors shrink-0"
          onClick={e => e.stopPropagation()}
        >
          <Download size={12} />
          다운로드
        </a>
        <button
          onClick={onClose}
          className="text-[#8b949e] hover:text-[#cdd9e5] transition-colors shrink-0"
        >
          <X size={16} />
        </button>
      </div>

      {/* 뷰어 */}
      {viewerUrl ? (
        <iframe
          src={viewerUrl}
          className="flex-1 w-full border-0"
          title={file.name}
        />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <p className="text-[14px] text-[#8b949e]">이 파일 형식은 미리보기를 지원하지 않습니다.</p>
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
    </div>
  )
}
