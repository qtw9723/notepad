# Sidebar Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 사이드바를 보라 팔레트 + 섹션 패널 스타일로 재디자인해 로그인 화면과 무드를 통일한다.

**Architecture:** `index.css`에 `.sidebar-*` CSS 클래스를 추가하고, `Sidebar.jsx`를 전면 재작성한다. 로직(상태, useMemo)은 동일하게 유지하고 마크업과 스타일만 교체한다.

**Tech Stack:** React 19, plain CSS (index.css), lucide-react

---

### Task 1: index.css에 사이드바 CSS 클래스 추가

**Files:**
- Modify: `src/index.css`

- [ ] **Step 1: index.css 맨 아래에 아래 CSS 블록을 추가한다**

```css
/* ── 사이드바 ── */
.sidebar {
  display: flex;
  flex-direction: column;
  background: #0d0d14;
  border-right: 1px solid rgba(157,143,252,0.1);
  height: 100%;
  flex-shrink: 0;
  transition: width 200ms ease;
  overflow: hidden;
}

/* 헤더 */
.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px 12px;
  border-bottom: 1px solid rgba(157,143,252,0.1);
  flex-shrink: 0;
}
.sidebar-header-title {
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #8b8890;
}
.sidebar-toggle-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: 1px solid rgba(157,143,252,0.2);
  background: rgba(157,143,252,0.08);
  color: #9d8ffc;
  cursor: pointer;
  transition: background 150ms;
  flex-shrink: 0;
}
.sidebar-toggle-btn:hover { background: rgba(157,143,252,0.15); }

/* 검색 */
.sidebar-search {
  padding: 12px 14px 10px;
  border-bottom: 1px solid rgba(157,143,252,0.06);
  flex-shrink: 0;
}
.sidebar-search-input {
  width: 100%;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(157,143,252,0.15);
  border-radius: 9px;
  padding: 8px 12px;
  font-size: 13px;
  color: #e2e2e2;
  outline: none;
  font-family: inherit;
  transition: border-color 150ms;
}
.sidebar-search-input::placeholder { color: #606070; }
.sidebar-search-input:focus { border-color: #9d8ffc; }

/* 태그 필터 */
.sidebar-tags {
  padding: 10px 14px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  flex-shrink: 0;
  border-bottom: 1px solid rgba(157,143,252,0.06);
}
.sidebar-tag {
  font-size: 11px;
  padding: 4px 10px;
  border-radius: 999px;
  color: #606070;
  border: 1px solid transparent;
  background: transparent;
  cursor: pointer;
  font-family: inherit;
  transition: background 150ms, color 150ms;
  display: flex;
  align-items: center;
  gap: 4px;
}
.sidebar-tag:hover { background: rgba(255,255,255,0.05); color: #a090e0; }
.sidebar-tag-active {
  background: rgba(157,143,252,0.15);
  border-color: rgba(157,143,252,0.3);
  color: #9d8ffc;
}
.sidebar-tag-active:hover { background: rgba(157,143,252,0.2); color: #9d8ffc; }

/* 스크롤 영역 */
.sidebar-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 10px 10px 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* 섹션 패널 */
.sidebar-section {
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(157,143,252,0.12);
  border-radius: 12px;
  overflow: hidden;
  flex-shrink: 0;
}
.sidebar-section-header {
  display: flex;
  align-items: center;
  padding: 10px 14px;
  background: rgba(157,143,252,0.05);
  border-bottom: 1px solid rgba(157,143,252,0.1);
  gap: 8px;
  cursor: pointer;
  user-select: none;
}
.sidebar-section-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #9d8ffc;
  opacity: 0.6;
  flex-shrink: 0;
}
.sidebar-section-name {
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #8b8890;
  flex: 1;
}
.sidebar-section-count {
  font-size: 10px;
  color: #404050;
  font-weight: 600;
}
.sidebar-section-add {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: #606070;
  cursor: pointer;
  opacity: 0;
  transition: opacity 150ms, background 150ms, color 150ms;
  flex-shrink: 0;
}
.sidebar-section:hover .sidebar-section-add { opacity: 1; }
.sidebar-section-add:hover { color: #9d8ffc; background: rgba(157,143,252,0.15); }

/* 노트 목록 */
.sidebar-note-list {
  padding: 6px 8px 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.sidebar-note {
  padding: 9px 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 150ms;
  position: relative;
}
.sidebar-note:hover { background: rgba(255,255,255,0.04); }
.sidebar-note-selected { background: rgba(157,143,252,0.12); }
.sidebar-note-selected:hover { background: rgba(157,143,252,0.15); }
.sidebar-note-title {
  font-size: 14px;
  font-weight: 500;
  color: #c8c8d8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
  padding-right: 28px;
}
.sidebar-note-selected .sidebar-note-title { color: #f0f0f0; }
.sidebar-note-meta {
  font-size: 11px;
  color: #484858;
  display: flex;
  align-items: center;
  gap: 4px;
}
.sidebar-note-tag { color: #7060c0; }
.sidebar-note-actions {
  position: absolute;
  top: 50%;
  right: 8px;
  transform: translateY(-50%);
  opacity: 0;
  transition: opacity 150ms;
}
.sidebar-note:hover .sidebar-note-actions { opacity: 1; }
.sidebar-note-delete {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: #606070;
  cursor: pointer;
  transition: color 150ms, background 150ms;
}
.sidebar-note-delete:hover { color: rgb(248,113,113); background: rgba(248,113,113,0.1); }

.sidebar-empty {
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #404050;
  font-size: 13px;
}

/* 하단 유저 영역 */
.sidebar-bottom {
  border-top: 1px solid rgba(157,143,252,0.1);
  padding: 12px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-shrink: 0;
}
.sidebar-avatar {
  width: 30px;
  height: 30px;
  border-radius: 9px;
  background: rgba(157,143,252,0.15);
  border: 1px solid rgba(157,143,252,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 800;
  color: #9d8ffc;
  flex-shrink: 0;
}
.sidebar-username {
  font-size: 14px;
  font-weight: 500;
  color: #c0c0d0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}
.sidebar-logout-btn {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: none;
  background: rgba(255,255,255,0.04);
  color: #606070;
  cursor: pointer;
  transition: color 150ms, background 150ms;
  flex-shrink: 0;
}
.sidebar-logout-btn:hover { color: rgb(248,113,113); background: rgba(248,113,113,0.1); }
.sidebar-login-btn {
  width: 100%;
  padding: 10px;
  border: 1px solid rgba(157,143,252,0.25);
  border-radius: 10px;
  background: transparent;
  color: #9d8ffc;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
  transition: background 150ms;
}
.sidebar-login-btn:hover { background: rgba(157,143,252,0.1); }

/* 접힌 상태 */
.sidebar-collapsed-header {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 0;
  border-bottom: 1px solid rgba(157,143,252,0.1);
  flex-shrink: 0;
}
.sidebar-collapsed-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: 1px solid rgba(157,143,252,0.2);
  background: rgba(157,143,252,0.08);
  color: #9d8ffc;
  cursor: pointer;
  transition: background 150ms;
}
.sidebar-collapsed-icon:hover { background: rgba(157,143,252,0.15); }
.sidebar-collapsed-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 0;
  gap: 4px;
  overflow-y: auto;
}
.sidebar-collapsed-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: #606070;
  cursor: pointer;
  font-size: 11px;
  font-weight: 800;
  transition: color 150ms, background 150ms;
}
.sidebar-collapsed-btn:hover { color: #a090e0; background: rgba(157,143,252,0.08); }
.sidebar-collapsed-divider {
  width: 20px;
  height: 1px;
  background: rgba(157,143,252,0.1);
  margin: 4px 0;
}
.sidebar-collapsed-bottom {
  border-top: 1px solid rgba(157,143,252,0.1);
  padding: 10px 0;
  display: flex;
  justify-content: center;
  flex-shrink: 0;
}
.sidebar-collapsed-logout {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: #606070;
  cursor: pointer;
  transition: color 150ms, background 150ms;
}
.sidebar-collapsed-logout:hover { color: rgb(248,113,113); background: rgba(248,113,113,0.1); }
.sidebar-collapsed-login {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: #9d8ffc;
  cursor: pointer;
  transition: background 150ms;
}
.sidebar-collapsed-login:hover { background: rgba(157,143,252,0.1); }
```

- [ ] **Step 2: 커밋**

```bash
git add src/index.css
git commit -m "style: add sidebar CSS classes"
```

---

### Task 2: Sidebar.jsx 재작성

**Files:**
- Modify: `src/components/Sidebar.jsx`

- [ ] **Step 1: 파일 전체를 아래 내용으로 교체**

```jsx
import { useState, useMemo } from 'react'
import { Plus, Search, Tag, FileText, Trash2, X, LogOut, PanelLeftClose, PanelLeftOpen, Lock } from 'lucide-react'

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
            <button onClick={toggleSidebar} className="sidebar-collapsed-icon" title="사이드바 열기">
              <PanelLeftOpen size={15} />
            </button>
          </div>
          <div className="sidebar-collapsed-body">
            <button onClick={toggleSidebar} title="검색" className="sidebar-collapsed-btn">
              <Search size={15} />
            </button>
            <div className="sidebar-collapsed-divider" />
            {sections.map(section => (
              <button key={section.name} onClick={toggleSidebar} title={section.name} className="sidebar-collapsed-btn">
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
                              {note.title || <span style={{ color: '#404050', fontStyle: 'italic', fontWeight: 400 }}>제목 없음</span>}
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
```

- [ ] **Step 2: 커밋**

```bash
git add src/components/Sidebar.jsx
git commit -m "design: sidebar redesign with purple palette and section panels"
```

---

### Task 3: 정리 및 배포

**Files:**
- Delete: `public/test.html`

- [ ] **Step 1: test.html 삭제 및 배포**

```bash
git rm public/test.html
git commit -m "chore: remove sidebar design mockup"
git push
```
