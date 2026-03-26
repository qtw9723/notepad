import { useState, useMemo } from 'react'
import { Plus, Search, Tag, FileText, Trash2, X, LogOut, ChevronRight, PanelLeftClose, PanelLeftOpen, Lock } from 'lucide-react'

const SIDEBAR_KEY = 'notepad-sidebar-open'

export default function Sidebar({
  notes, projects, currentProject, isMaster,
  selectedId, onSelect, onCreate, onDelete, onSignOut, onShowLogin,
}) {
  const [isOpen, setIsOpen] = useState(() => localStorage.getItem(SIDEBAR_KEY) !== 'false')
  const [search, setSearch] = useState('')
  const [activeTag, setActiveTag] = useState(null)
  const [collapsedSections, setCollapsedSections] = useState(new Set())

  const toggleSidebar = () => {
    setIsOpen(prev => {
      localStorage.setItem(SIDEBAR_KEY, !prev)
      return !prev
    })
  }

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

  const sections = useMemo(() => {
    const publicNotes = filtered.filter(n => !n.user_id)
    const result = []
    result.push({ name: '공개', notes: publicNotes, canCreate: false, icon: '🌐' })

    if (isMaster) {
      projects.forEach(p => {
        const pNotes = filtered.filter(n => n.user_id === p.user_id)
        const isMySection = currentProject?.user_id === p.user_id
        result.push({ name: p.name, notes: pNotes, canCreate: isMySection, icon: p.name[0].toUpperCase() })
      })
    } else if (currentProject) {
      const myNotes = filtered.filter(n => n.user_id === currentProject.user_id)
      result.push({ name: currentProject.name, notes: myNotes, canCreate: true, icon: currentProject.name[0].toUpperCase() })
    }

    return result
  }, [filtered, projects, currentProject, isMaster])

  const fmt = (iso) => {
    const d = new Date(iso)
    return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
  }

  const isLoggedIn = !!currentProject || isMaster

  return (
    <aside
      className="flex flex-col bg-[#161b22] border-r border-[#21262d] h-full shrink-0 transition-all duration-200"
      style={{ width: isOpen ? 288 : 48 }}
    >
      {/* 토글 버튼 */}
      <div className={`flex items-center border-b border-[#21262d] shrink-0 ${isOpen ? 'px-3 py-3 justify-between' : 'px-2 py-3 justify-center'}`}>
        {isOpen && (
          <span className="text-[13px] font-semibold text-[#8b949e] tracking-widest uppercase">메모</span>
        )}
        <button
          onClick={toggleSidebar}
          className="w-7 h-7 flex items-center justify-center rounded-md text-[#8b949e] hover:text-[#e6edf3] hover:bg-white/5 transition-all duration-150"
          title={isOpen ? '사이드바 닫기' : '사이드바 열기'}
        >
          {isOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
        </button>
      </div>

      {/* 접힌 상태 — 아이콘 목록 */}
      {!isOpen && (
        <div className="flex-1 flex flex-col items-center py-2 gap-1 overflow-y-auto">
          {/* 검색 아이콘 */}
          <button
            onClick={toggleSidebar}
            title="검색"
            className="w-8 h-8 flex items-center justify-center rounded-md text-[#8b949e] hover:text-[#e6edf3] hover:bg-white/5 transition-all duration-150"
          >
            <Search size={15} />
          </button>

          <div className="w-5 border-t border-[#21262d] my-1" />

          {/* 구획 아이콘 */}
          {sections.map(section => (
            <button
              key={section.name}
              onClick={toggleSidebar}
              title={section.name}
              className="w-8 h-8 flex items-center justify-center rounded-md text-[#8b949e] hover:text-[#e6edf3] hover:bg-white/5 transition-all duration-150 text-[11px] font-bold"
            >
              {section.icon}
            </button>
          ))}

          <div className="flex-1" />

          {/* 로그인/로그아웃 아이콘 */}
          {isLoggedIn ? (
            <button onClick={onSignOut} title="로그아웃" className="w-8 h-8 flex items-center justify-center rounded-md text-[#8b949e] hover:text-red-400 hover:bg-red-400/10 transition-all duration-150">
              <LogOut size={15} />
            </button>
          ) : (
            <button onClick={onShowLogin} title="프로젝트 로그인" className="w-8 h-8 flex items-center justify-center rounded-md text-[#388bfd] hover:bg-[#388bfd]/10 transition-all duration-150">
              <Lock size={15} />
            </button>
          )}
        </div>
      )}

      {/* 펼친 상태 */}
      {isOpen && (
        <>
          {/* 검색 */}
          <div className="px-3 py-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b949e] pointer-events-none" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="검색..."
                className="w-full bg-[#0d1117] text-[14px] text-[#e6edf3] placeholder-[#484f58] pl-9 pr-3 py-2 rounded-md border border-[#21262d] focus:outline-none focus:border-[#388bfd]/50 transition-all duration-150"
              />
            </div>
          </div>

          {/* 태그 필터 */}
          {allTags.length > 0 && (
            <div className="px-3 pb-2 flex flex-wrap gap-1.5">
              {activeTag && (
                <button
                  onClick={() => setActiveTag(null)}
                  className="flex items-center gap-1 text-[12px] px-2.5 py-1 rounded-full bg-[#388bfd]/20 text-[#58a6ff] transition-all duration-150"
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
                      ? 'bg-[#388bfd]/20 text-[#58a6ff]'
                      : 'text-[#8b949e] hover:text-[#cdd9e5] hover:bg-white/5'
                  }`}
                >
                  <Tag size={10} />{tag}
                </button>
              ))}
            </div>
          )}

          <div className="mx-3 border-t border-[#21262d] mb-1" />

          {/* 구획별 노트 목록 */}
          <div className="flex-1 overflow-y-auto py-1">
            {sections.map((section, idx) => {
              const isCollapsed = collapsedSections.has(section.name)
              return (
                <div key={section.name}>
                  {idx > 0 && <div className="mx-3 border-t border-[#21262d] mt-2 mb-1" />}
                  <div className="flex items-center group/section">
                    <button
                      onClick={() => toggleSection(section.name)}
                      className="flex-1 flex items-center gap-2 px-3 py-2 hover:bg-white/5 transition-colors duration-150 group"
                    >
                      <ChevronRight
                        size={13}
                        className={`text-[#484f58] transition-transform duration-200 ${isCollapsed ? '' : 'rotate-90'}`}
                      />
                      <span className="text-[12px] font-semibold text-[#8b949e] group-hover:text-[#cdd9e5] uppercase tracking-widest transition-colors duration-150">
                        {section.name}
                      </span>
                      <span className="ml-auto text-[12px] text-[#484f58]">{section.notes.length}</span>
                    </button>
                    {section.canCreate && (
                      <button
                        onClick={onCreate}
                        title="새 메모"
                        className="opacity-0 group-hover/section:opacity-100 mr-2 w-6 h-6 flex items-center justify-center rounded text-[#8b949e] hover:text-[#58a6ff] hover:bg-[#388bfd]/10 transition-all duration-150"
                      >
                        <Plus size={14} />
                      </button>
                    )}
                  </div>

                  {!isCollapsed && (section.notes.length === 0 ? (
                    <div className="px-5 py-2.5 flex items-center gap-2 text-[#484f58]">
                      <FileText size={14} className="opacity-40" />
                      <span className="text-[13px]">메모 없음</span>
                    </div>
                  ) : (
                    <div className="px-2">
                      {section.notes.map(note => (
                        <div
                          key={note.id}
                          onClick={() => onSelect(note.id)}
                          className={`group relative flex items-stretch rounded-md cursor-pointer transition-all duration-150 mb-0.5 overflow-hidden ${
                            selectedId === note.id ? 'bg-[#388bfd]/10' : 'hover:bg-white/5'
                          }`}
                        >
                          {/* 선택 강조 세로 바 */}
                          <div className={`w-0.5 shrink-0 rounded-full transition-all duration-150 ${
                            selectedId === note.id ? 'bg-[#388bfd]' : 'bg-transparent'
                          }`} />
                          <div className="flex-1 px-2.5 py-2.5">
                            <div className="flex items-center justify-between gap-1">
                              <p className={`text-[14px] font-medium leading-snug truncate transition-colors duration-150 ${
                                selectedId === note.id ? 'text-[#e6edf3]' : 'text-[#cdd9e5]'
                              }`}>
                                {note.title || <span className="text-[#484f58] italic font-normal">제목 없음</span>}
                              </p>
                              {isLoggedIn && (
                                <button
                                  onClick={e => { e.stopPropagation(); onDelete(note.id) }}
                                  className="opacity-0 group-hover:opacity-100 p-1 rounded text-[#8b949e] hover:text-red-400 hover:bg-red-400/10 transition-all duration-150 shrink-0"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[12px] text-[#484f58]">{fmt(note.updated_at)}</span>
                              {(note.tags || []).slice(0, 2).map(t => (
                                <span key={t} className="text-[12px] text-[#8b949e]">#{t}</span>
                              ))}
                            </div>
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
          <div className="mx-3 border-t border-[#21262d] mt-1" />
          {isLoggedIn ? (
            <div className="px-3 py-3 flex items-center justify-between gap-2">
              <span className="text-[13px] text-[#8b949e] truncate">
                {currentProject?.name ?? '마스터'}
              </span>
              <button
                onClick={onSignOut}
                title="로그아웃"
                className="shrink-0 w-7 h-7 flex items-center justify-center rounded-md text-[#8b949e] hover:text-red-400 hover:bg-red-400/10 transition-all duration-150"
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <div className="px-3 py-3">
              <button
                onClick={onShowLogin}
                className="w-full py-2.5 text-[14px] font-medium text-[#388bfd] border border-[#388bfd]/30 rounded-lg hover:bg-[#388bfd]/10 transition-all duration-150"
              >
                프로젝트 로그인
              </button>
            </div>
          )}
        </>
      )}
    </aside>
  )
}
