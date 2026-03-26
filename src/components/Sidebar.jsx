import { useState, useMemo } from 'react'
import { Plus, Search, Tag, FileText, Trash2, X, LogOut, ChevronRight } from 'lucide-react'

export default function Sidebar({
  notes, projects, currentProject, isMaster,
  selectedId, onSelect, onCreate, onDelete, onSignOut, onShowLogin,
}) {
  const [search, setSearch] = useState('')
  const [activeTag, setActiveTag] = useState(null)
  const [collapsedSections, setCollapsedSections] = useState(new Set())

  const toggleSection = (name) => {
    setCollapsedSections(prev => {
      const next = new Set(prev)
      next.has(name) ? next.delete(name) : next.add(name)
      return next
    })
  }

  const allTags = useMemo(() => {
    const tagSet = new Set()
    notes.forEach(n => (n.tags || []).forEach(t => tagSet.add(t)))
    return [...tagSet].sort()
  }, [notes])

  const filtered = useMemo(() => {
    return notes.filter(n => {
      const matchSearch = !search || n.title.toLowerCase().includes(search.toLowerCase())
      const matchTag = !activeTag || (n.tags || []).includes(activeTag)
      return matchSearch && matchTag
    })
  }, [notes, search, activeTag])

  // 노트를 구획으로 분류
  const sections = useMemo(() => {
    const publicNotes = filtered.filter(n => !n.user_id)
    const result = []

    result.push({ name: '공개', notes: publicNotes, canCreate: false })

    if (isMaster) {
      projects.forEach(p => {
        const pNotes = filtered.filter(n => n.user_id === p.user_id)
        const isMySection = currentProject?.user_id === p.user_id
        result.push({ name: p.name, notes: pNotes, canCreate: isMySection })
      })
    } else if (currentProject) {
      const myNotes = filtered.filter(n => n.user_id === currentProject.user_id)
      result.push({ name: currentProject.name, notes: myNotes, canCreate: true })
    }

    return result
  }, [filtered, projects, currentProject, isMaster])

  const fmt = (iso) => {
    const d = new Date(iso)
    return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
  }

  const isLoggedIn = !!currentProject || isMaster

  return (
    <aside className="w-72 flex flex-col bg-[#161618] border-r border-[#1f1f24] h-full shrink-0">
      {/* 헤더 */}
      <div className="px-4 pt-5 pb-3">
        <div className="flex items-center mb-4 px-1">
          <span className="text-[15px] font-semibold text-[#a0a0b8] tracking-wide uppercase">메모</span>
        </div>

        {/* 검색 */}
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#505060] pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="검색..."
            className="w-full bg-[#0f0f10] text-[14px] text-[#c0c0d0] placeholder-[#404050] pl-9 pr-3 py-2 rounded-md border border-[#242428] focus:outline-none focus:border-[#7c6af5]/50 transition-all duration-150"
          />
        </div>
      </div>

      {/* 태그 필터 */}
      {allTags.length > 0 && (
        <div className="px-4 pb-3 flex flex-wrap gap-1.5">
          {activeTag && (
            <button
              onClick={() => setActiveTag(null)}
              className="flex items-center gap-1 text-[12px] px-2.5 py-1 rounded-full bg-[#7c6af5]/20 text-[#a990ff] transition-all duration-150"
            >
              <X size={10} />전체
            </button>
          )}
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              className={`flex items-center gap-1 text-[12px] px-2.5 py-1 rounded-full transition-all duration-150 ${
                activeTag === tag
                  ? 'bg-[#7c6af5]/20 text-[#a990ff]'
                  : 'text-[#505068] hover:text-[#8080a0] hover:bg-white/5'
              }`}
            >
              <Tag size={10} />{tag}
            </button>
          ))}
        </div>
      )}

      <div className="mx-4 border-t border-[#1f1f24] mb-1" />

      {/* 구획별 노트 목록 */}
      <div className="flex-1 overflow-y-auto py-1">
        {sections.map((section, idx) => {
          const isCollapsed = collapsedSections.has(section.name)
          return (
          <div key={section.name}>
            {idx > 0 && (
              <div className="mx-4 border-t border-[#1f1f24] mt-2 mb-1" />
            )}
            <div className="flex items-center group/section">
              <button
                onClick={() => toggleSection(section.name)}
                className="flex-1 flex items-center gap-2 px-4 py-2 hover:bg-white/5 transition-colors duration-150 group"
              >
                <ChevronRight
                  size={13}
                  className={`text-[#404055] transition-transform duration-200 ${isCollapsed ? '' : 'rotate-90'}`}
                />
                <span className="text-[12px] font-semibold text-[#505065] group-hover:text-[#707085] uppercase tracking-widest transition-colors duration-150">
                  {section.name}
                </span>
                <span className="ml-auto text-[12px] text-[#404055]">{section.notes.length}</span>
              </button>
              {section.canCreate && (
                <button
                  onClick={onCreate}
                  title="새 메모"
                  className="opacity-0 group-hover/section:opacity-100 mr-3 w-6 h-6 flex items-center justify-center rounded text-[#606070] hover:text-[#a990ff] hover:bg-[#7c6af5]/10 transition-all duration-150"
                >
                  <Plus size={14} />
                </button>
              )}
            </div>

            {!isCollapsed && (section.notes.length === 0 ? (
              <div className="px-5 py-2.5 flex items-center gap-2 text-[#383848]">
                <FileText size={14} className="opacity-40" />
                <span className="text-[13px]">메모 없음</span>
              </div>
            ) : (
              <div className="px-2">
                {section.notes.map(note => (
                  <div
                    key={note.id}
                    onClick={() => onSelect(note.id)}
                    className={`group relative px-3 py-2.5 rounded-md cursor-pointer transition-all duration-150 mb-0.5 ${
                      selectedId === note.id
                        ? 'bg-[#7c6af5]/12 text-white'
                        : 'text-[#c0c0d0] hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <p className={`text-[14px] font-medium leading-snug truncate transition-colors duration-150 ${
                        selectedId === note.id ? 'text-white' : 'text-[#d0d0e0]'
                      }`}>
                        {note.title || <span className="text-[#404050] italic font-normal">제목 없음</span>}
                      </p>
                      {isLoggedIn && (
                        <button
                          onClick={e => { e.stopPropagation(); onDelete(note.id) }}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded text-[#505060] hover:text-red-400 hover:bg-red-400/10 transition-all duration-150 shrink-0"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[12px] text-[#404055]">{fmt(note.updated_at)}</span>
                      {(note.tags || []).slice(0, 2).map(t => (
                        <span key={t} className="text-[12px] text-[#505068]">#{t}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )
      })}
      </div>

      {/* 하단 유저 정보 */}
      <div className="mx-4 border-t border-[#1f1f24] mt-1" />
      {currentProject || isMaster ? (
        <div className="px-4 py-3.5 flex items-center justify-between gap-2">
          <span className="text-[13px] text-[#606075] truncate">
            {currentProject?.name ?? '마스터'}
          </span>
          <button
            onClick={onSignOut}
            title="로그아웃"
            className="shrink-0 w-7 h-7 flex items-center justify-center rounded-md text-[#606070] hover:text-red-400 hover:bg-red-400/10 transition-all duration-150"
          >
            <LogOut size={15} />
          </button>
        </div>
      ) : (
        <div className="px-4 py-3.5">
          <button
            onClick={onShowLogin}
            className="w-full py-2.5 text-[14px] font-medium text-[#7c6af5] border border-[#7c6af5]/30 rounded-lg hover:bg-[#7c6af5]/10 transition-all duration-150"
          >
            프로젝트 로그인
          </button>
        </div>
      )}
    </aside>
  )
}
