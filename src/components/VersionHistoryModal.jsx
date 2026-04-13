import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { X } from 'lucide-react'
import { api } from '../lib/api'

const TRIGGER_LABELS = {
  daily_backup: '자정 백업',
  shrinkage: '삭제 감지',
  pre_restore: '복구 전 보존',
}

function formatDate(iso) {
  const d = new Date(iso)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function VersionHistoryModal({ noteId, onClose, onRestore }) {
  const [versions, setVersions] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [restoring, setRestoring] = useState(false)

  useEffect(() => {
    api.getVersions(noteId)
      .then(data => {
        setVersions(data)
        if (data.length > 0) setSelected(data[0])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [noteId])

  const handleRestore = async () => {
    if (!selected || restoring) return
    setRestoring(true)
    try {
      const restoredNote = await api.restoreVersion(noteId, selected.id)
      onRestore(restoredNote)
    } catch (e) {
      console.error('복구 실패:', e)
    } finally {
      setRestoring(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[#0d1117] border border-[#21262d] rounded-2xl shadow-2xl w-[860px] max-w-[95vw] h-[580px] max-h-[90vh] flex flex-col overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#21262d] shrink-0">
          <span className="text-[14px] font-semibold text-[#e6edf3]">버전 히스토리</span>
          <button
            onClick={onClose}
            className="text-[#8b949e] hover:text-[#cdd9e5] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center text-[13px] text-[#484f58]">
            불러오는 중...
          </div>
        ) : versions.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-[13px] text-[#484f58]">
            저장된 버전이 없습니다
          </div>
        ) : (
          <div className="flex-1 flex overflow-hidden min-h-0">
            {/* 버전 목록 */}
            <div className="w-[220px] shrink-0 border-r border-[#21262d] overflow-y-auto">
              {versions.map(v => (
                <button
                  key={v.id}
                  onClick={() => setSelected(v)}
                  className={`w-full text-left px-4 py-3 border-b border-[#21262d] transition-colors ${
                    selected?.id === v.id
                      ? 'bg-[#161b22]'
                      : 'hover:bg-[#161b22]/50'
                  }`}
                >
                  <p className="text-[12px] text-[#cdd9e5] font-mono">{formatDate(v.created_at)}</p>
                  <p className={`text-[12px] mt-0.5 ${
                    v.trigger === 'shrinkage' ? 'text-[#f87171]'
                    : v.trigger === 'pre_restore' ? 'text-[#9d8ffc]'
                    : 'text-[#8b949e]'
                  }`}>
                    {TRIGGER_LABELS[v.trigger]}
                  </p>
                </button>
              ))}
            </div>

            {/* 미리보기 */}
            <div className="flex-1 flex flex-col overflow-hidden min-w-0">
              <div className="flex-1 overflow-y-auto px-8 py-6">
                {selected && (
                  <>
                    <h2
                      className="text-[1.4rem] font-bold text-[#e6edf3] leading-tight mb-4"
                      style={{ letterSpacing: '-0.02em' }}
                    >
                      {selected.title || <span className="text-[#21262d]">제목 없음</span>}
                    </h2>
                    <div className="border-t border-[#21262d] mb-5" />
                    {selected.content_type === 'markdown' ? (
                      <div className="markdown-body text-[#cdd9e5] text-[0.9rem]">
                        {selected.content
                          ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{selected.content}</ReactMarkdown>
                          : <p className="text-[#484f58] italic text-sm">내용 없음</p>
                        }
                      </div>
                    ) : selected.content_type === 'html' ? (
                      <div
                        className="text-[#cdd9e5] text-[0.9rem] leading-[2.0]"
                        dangerouslySetInnerHTML={{ __html: selected.content || '' }}
                      />
                    ) : (
                      <p className="text-[#cdd9e5] text-[0.9rem] leading-[2.0] whitespace-pre-wrap">
                        {selected.content}
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* 복구 버튼 */}
              <div className="shrink-0 px-8 py-4 border-t border-[#21262d] flex justify-end">
                <button
                  onClick={handleRestore}
                  disabled={!selected || restoring}
                  className="px-5 py-2 rounded-lg bg-[#9d8ffc] text-[#0d0d10] text-[13px] font-semibold hover:bg-[#b8aeff] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {restoring ? '복구 중...' : '이 버전으로 복구'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
