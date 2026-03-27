import { useState, useMemo } from 'react'
import { Plus, Tag, FileText, Trash2, X, LogOut, PanelLeftClose, PanelLeftOpen, Lock } from 'lucide-react'

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
    <aside className="sidebar" style={{ width: isOpen ? 288 : 48 }}>

      {/* ── 접힌 상태 ── */}
      {!isOpen && (
        <>
          <div className="sidebar-collapsed-header">
            <button onClick={toggleSidebar} className="sidebar-toggle-btn" title="사이드바 열기">
              <PanelLeftOpen size={15} />
            </button>
          </div>
          <div className="sidebar-collapsed-body">
            {sections.map(section => (
              <button key={section.name} onClick={toggleSidebar} title={section.name} className="sidebar-collapsed-section-btn">
                {section.icon}
              </button>
            ))}
          </div>
          <div className="sidebar-collapsed-bottom">
            {isLoggedIn ? (
              <button onClick={onSignOut} title="로그아웃" className="sidebar-collapsed-logout">
                <LogOut size={15} />
              </button>
            ) : (
              <button onClick={onShowLogin} title="프로젝트 로그인" className="sidebar-collapsed-login">
                <Lock size={15} />
              </button>
            )}
          </div>
        </>
      )}

      {/* ── 펼친 상태 ── */}
      {isOpen && (
        <>
          <div className="sidebar-header">
            <span className="sidebar-header-title">메모</span>
            <button onClick={toggleSidebar} className="sidebar-toggle-btn" title="사이드바 닫기">
              <PanelLeftClose size={15} />
            </button>
          </div>

          <div className="sidebar-search">
            <input
              className="sidebar-search-input"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="검색..."
            />
          </div>

          {allTags.length > 0 && (
            <div className="sidebar-tags">
              {activeTag && (
                <button onClick={() => setActiveTag(null)} className="sidebar-tag sidebar-tag-active">
                  <X size={10} /> 전체
                </button>
              )}
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                  className={activeTag === tag ? 'sidebar-tag sidebar-tag-active' : 'sidebar-tag'}
                >
                  <Tag size={10} /> {tag}
                </button>
              ))}
            </div>
          )}

          <div className="sidebar-scroll">
            {sections.map(section => {
              const isCollapsed = collapsedSections.has(section.name)
              return (
                <div key={section.name} className="sidebar-section">
                  <div className="sidebar-section-header" onClick={() => toggleSection(section.name)}>
                    <div className="sidebar-section-dot" />
                    <span className="sidebar-section-name">{section.name}</span>
                    <span className="sidebar-section-count">{section.notes.length}</span>
                    {section.canCreate && (
                      <button
                        className="sidebar-section-add"
                        onClick={e => { e.stopPropagation(); onCreate() }}
                        title="새 메모"
                      >
                        <Plus size={14} />
                      </button>
                    )}
                  </div>

                  {!isCollapsed && (
                    <div className="sidebar-note-list">
                      {section.notes.length === 0 ? (
                        <div className="sidebar-empty">
                          <FileText size={14} />
                          <span>메모 없음</span>
                        </div>
                      ) : (
                        section.notes.map(note => (
                          <div
                            key={note.id}
                            onClick={() => onSelect(note.id)}
                            className={`sidebar-note${selectedId === note.id ? ' sidebar-note-selected' : ''}`}
                          >
                            <div className="sidebar-note-title">
                              {note.title || <span className="sidebar-note-title-empty">제목 없음</span>}
                            </div>
                            <div className="sidebar-note-meta">
                              <span>{fmt(note.updated_at)}</span>
                              {(note.tags || []).slice(0, 2).map(t => (
                                <span key={t} className="sidebar-note-tag">#{t}</span>
                              ))}
                            </div>
                            {isLoggedIn && (
                              <div className="sidebar-note-actions">
                                <button
                                  className="sidebar-note-delete"
                                  onClick={e => { e.stopPropagation(); onDelete(note.id) }}
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="sidebar-bottom">
            {isLoggedIn ? (
              <>
                <div className="sidebar-avatar">
                  {(currentProject?.name ?? 'M')[0].toUpperCase()}
                </div>
                <span className="sidebar-username">
                  {currentProject?.name ?? '마스터'}
                </span>
                <button onClick={onSignOut} title="로그아웃" className="sidebar-logout-btn">
                  <LogOut size={15} />
                </button>
              </>
            ) : (
              <button onClick={onShowLogin} className="sidebar-login-btn">
                프로젝트 로그인
              </button>
            )}
          </div>
        </>
      )}
    </aside>
  )
}
