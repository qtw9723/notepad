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

    result.push({ name: '공개', notes: publicNotes })

    if (isMaster) {
      // 마스터: 모든 프로젝트 구획 표시
      projects.forEach(p => {
        const pNotes = filtered.filter(n => n.user_id === p.user_id)
        if (pNotes.length > 0) {
          result.push({ name: p.name, notes: pNotes })
        }
      })
    } else if (currentProject) {
      // 일반 로그인: 본인 프로젝트 구획만
      const myNotes = filtered.filter(n => n.user_id === currentProject.user_id)
      if (myNotes.length > 0) {
        result.push({ name: currentProject.name, notes: myNotes })
      }
    }

    return result
  }, [filtered, projects, currentProject, isMaster])

  const fmt = (iso) => {
    const d = new Date(iso)
    return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
  }

  const isLoggedIn = !!currentProject || isMaster

  return (
    <aside className="w-60 flex flex-col bg-[#161618] border-r border-[#1f1f24] h-full shrink-0">
      {/* 헤더 */}
      <div className="px-3 pt-4 pb-2">
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-[13px] font-semibold text-[#a0a0b8] tracking-wide uppercase">메모</span>
          {isLoggedIn && (
            <button
              onClick={onCreate}
              title="새 메모"
              className="w-6 h-6 flex items-center justify-center rounded-md text-[#606070] hover:text-[#a990ff] hover:bg-[#7c6af5]/10 transition-all duration-150"
            >
              <Plus size={16} />
            </button>
          )}
        </div>

        {/* 검색 */}
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#505060] pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="검색..."
            className="w-full bg-[#0f0f10] text-[13px] text-[#c0c0d0] placeholder-[#404050] pl-7 pr-3 py-1.5 rounded-md border border-[#242428] focus:outline-none focus:border-[#7c6af5]/50 transition-all duration-150"
          />
        </div>
      </div>

      {/* 태그 필터 */}
      {allTags.length > 0 && (
        <div className="px-3 pb-2 flex flex-wrap gap-1">
          {activeTag && (
            <button
              onClick={() => setActiveTag(null)}
              className="flex items-center gap-0.5 text-[11px] px-2 py-0.5 rounded-full bg-[#7c6af5]/20 text-[#a990ff] transition-all duration-150"
            >
              <X size={9} />전체
            </button>
          )}
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              className={`flex items-center gap-0.5 text-[11px] px-2 py-0.5 rounded-full transition-all duration-150 ${
                activeTag === tag
                  ? 'bg-[#7c6af5]/20 text-[#a990ff]'
                  : 'text-[#505068] hover:text-[#8080a0] hover:bg-white/5'
              }`}
            >
              <Tag size={9} />{tag}
            </button>
          ))}
        </div>
      )}

      <div className="mx-3 border-t border-[#1f1f24] mb-1" />

      {/* 구획별 노트 목록 */}
      <div className="flex-1 overflow-y-auto py-1">
        {sections.map((section, idx) => {
          const isCollapsed = collapsedSections.has(section.name)
          return (
          <div key={section.name}>
            {/* 구획 헤더 (첫 구획 아닐 때 구분선 포함) */}
            {idx > 0 && (
              <div className="mx-3 border-t border-[#1f1f24] mt-2 mb-1" />
            )}
            <button
              onClick={() => toggleSection(section.name)}
              className="w-full flex items-center gap-1.5 px-3 py-1.5 hover:bg-white/5 transition-colors duration-150 group"
            >
              <ChevronRight
                size={11}
                className={`text-[#404055] transition-transform duration-200 ${isCollapsed ? '' : 'rotate-90'}`}
              />
              <span className="text-[10px] font-semibold text-[#404055] group-hover:text-[#606070] uppercase tracking-widest transition-colors duration-150">
                {section.name}
              </span>
              <span className="ml-auto text-[10px] text-[#383848]">{section.notes.length}</span>
            </button>

            {/* 해당 구획의 노트들 */}
            {!isCollapsed && (section.notes.length === 0 ? (
              <div className="px-4 py-2 flex items-center gap-2 text-[#383848]">
                <FileText size={13} className="opacity-40" />
                <span className="text-[12px]">메모 없음</span>
              </div>
            ) : (
              <div className="px-1.5">
                {section.notes.map(note => (
                  <div
                    key={note.id}
                    onClick={() => onSelect(note.id)}
                    className={`group relative px-2.5 py-2 rounded-md cursor-pointer transition-all duration-150 mb-0.5 ${
                      selectedId === note.id
                        ? 'bg-[#7c6af5]/12 text-white'
                        : 'text-[#c0c0d0] hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <p className={`text-[13.5px] font-medium leading-snug truncate transition-colors duration-150 ${
                        selectedId === note.id ? 'text-white' : 'text-[#d0d0e0]'
                      }`}>
                        {note.title || <span className="text-[#404050] italic font-normal">제목 없음</span>}
                      </p>
                      {isLoggedIn && (
                        <button
                          onClick={e => { e.stopPropagation(); onDelete(note.id) }}
                          className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-[#505060] hover:text-red-400 hover:bg-red-400/10 transition-all duration-150 shrink-0"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-[#404055]">{fmt(note.updated_at)}</span>
                      {(note.tags || []).slice(0, 2).map(t => (
                        <span key={t} className="text-[11px] text-[#505068]">#{t}</span>
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
      <div className="mx-3 border-t border-[#1f1f24] mt-1" />
      {currentProject || isMaster ? (
        <div className="px-3 py-3 flex items-center justify-between gap-2">
          <span className="text-[11px] text-[#505068] truncate">
            {currentProject?.name ?? '마스터'}
          </span>
          <button
            onClick={onSignOut}
            title="로그아웃"
            className="shrink-0 w-6 h-6 flex items-center justify-center rounded-md text-[#606070] hover:text-red-400 hover:bg-red-400/10 transition-all duration-150"
          >
            <LogOut size={13} />
          </button>
        </div>
      ) : (
        <div className="px-3 py-3">
          <button
            onClick={onShowLogin}
            className="w-full py-1.5 text-[12px] text-[#7c6af5] border border-[#7c6af5]/30 rounded-md hover:bg-[#7c6af5]/10 transition-all duration-150"
          >
            프로젝트 로그인
          </button>
        </div>
      )}
    </aside>
  )
}
