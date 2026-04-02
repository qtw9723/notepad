import { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import { Plus, Tag, FileText, Trash2, X, LogOut, PanelLeftClose, PanelLeftOpen, Lock } from 'lucide-react'
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core'
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const SIDEBAR_KEY = 'notepad-sidebar-open'
const SIDEBAR_WIDTH_KEY = 'notepad-sidebar-width'
const NOTE_ORDER_KEY = 'notepad-note-order'
const SECTION_ORDER_KEY = 'notepad-section-order'

function SortableNote({ note, selectedId, onSelect, onDelete, isLoggedIn, fmt }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: note.id })
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      onClick={() => onSelect(note.id)}
      className={`sidebar-note${selectedId === note.id ? ' sidebar-note-selected' : ''}`}
      {...attributes}
      {...listeners}
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
  )
}

function SortableSection({
  section, isCollapsed, onToggle, onCreate,
  selectedId, onSelect, onDelete, isLoggedIn, fmt, onNoteDragEnd,
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.name })
  const noteSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className="sidebar-section"
    >
      <div
        className="sidebar-section-header"
        onClick={onToggle}
        {...attributes}
        {...listeners}
      >
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
        <DndContext sensors={noteSensors} collisionDetection={closestCenter} onDragEnd={onNoteDragEnd}>
          <SortableContext items={section.notes.map(n => n.id)} strategy={verticalListSortingStrategy}>
            <div className="sidebar-note-list">
              {section.notes.length === 0 ? (
                <div className="sidebar-empty">
                  <FileText size={14} />
                  <span>메모 없음</span>
                </div>
              ) : (
                section.notes.map(note => (
                  <SortableNote
                    key={note.id}
                    note={note}
                    selectedId={selectedId}
                    onSelect={onSelect}
                    onDelete={onDelete}
                    isLoggedIn={isLoggedIn}
                    fmt={fmt}
                  />
                ))
              )}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  )
}

export default function Sidebar({
  notes, projects, currentProject, isMaster,
  selectedId, onSelect, onCreate, onDelete, onSignOut, onShowLogin,
  isMobile = false,
}) {
  const [isOpen, setIsOpen] = useState(() => localStorage.getItem(SIDEBAR_KEY) !== 'false')
  const [search, setSearch] = useState('')
  const [activeTag, setActiveTag] = useState(null)
  const [collapsedSections, setCollapsedSections] = useState(new Set())
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY)
    return saved ? parseInt(saved, 10) : 288
  })
  const [isResizing, setIsResizing] = useState(false)
  const resizeStart = useRef(null)
  const [noteOrder, setNoteOrder] = useState(() => {
    try { return JSON.parse(localStorage.getItem(NOTE_ORDER_KEY) || '[]') }
    catch { return [] }
  })
  const [sectionOrder, setSectionOrder] = useState(() => {
    try { return JSON.parse(localStorage.getItem(SECTION_ORDER_KEY) || '[]') }
    catch { return [] }
  })

  // ── useMemos ──

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
    const sortByOrder = (arr) => {
      if (noteOrder.length === 0) return arr
      return [...arr].sort((a, b) => {
        const ai = noteOrder.indexOf(a.id)
        const bi = noteOrder.indexOf(b.id)
        if (ai === -1 && bi === -1) return 0
        if (ai === -1) return 1
        if (bi === -1) return -1
        return ai - bi
      })
    }
    const result = []
    result.push({ name: '공개', notes: sortByOrder(filtered.filter(n => !n.user_id)), canCreate: false, userId: null, icon: '🌐' })
    if (isMaster) {
      projects.forEach(p => {
        const pNotes = sortByOrder(filtered.filter(n => n.user_id === p.user_id))
        result.push({ name: p.name, notes: pNotes, canCreate: true, userId: p.user_id, icon: p.name[0].toUpperCase() })
      })
    } else if (currentProject) {
      const myNotes = sortByOrder(filtered.filter(n => n.user_id === currentProject.user_id))
      result.push({ name: currentProject.name, notes: myNotes, canCreate: true, userId: currentProject.user_id, icon: currentProject.name[0].toUpperCase() })
    }
    return result
  }, [filtered, projects, currentProject, isMaster, noteOrder])

  const sortedSections = useMemo(() => {
    if (sectionOrder.length === 0) return sections
    return [...sections].sort((a, b) => {
      const ai = sectionOrder.indexOf(a.name)
      const bi = sectionOrder.indexOf(b.name)
      if (ai === -1 && bi === -1) return 0
      if (ai === -1) return 1
      if (bi === -1) return -1
      return ai - bi
    })
  }, [sections, sectionOrder])

  // ── 사이드바 너비 ──

  const startResize = useCallback((e) => {
    resizeStart.current = { x: e.clientX, width: sidebarWidth }
    setIsResizing(true)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [sidebarWidth])

  useEffect(() => {
    const onMouseMove = (e) => {
      if (!resizeStart.current) return
      const delta = e.clientX - resizeStart.current.x
      const newWidth = Math.min(480, Math.max(200, resizeStart.current.width + delta))
      setSidebarWidth(newWidth)
    }
    const onMouseUp = () => {
      if (!resizeStart.current) return
      resizeStart.current = null
      setIsResizing(false)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      setSidebarWidth(prev => {
        localStorage.setItem(SIDEBAR_WIDTH_KEY, prev)
        return prev
      })
    }
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  // ── 드래그 핸들러 ──

  const sectionSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const handleNoteDragEnd = useCallback(({ active, over }) => {
    if (!over || active.id === over.id) return
    setNoteOrder(prev => {
      const allIds = notes.map(n => n.id)
      let order = prev.length > 0 ? [...prev] : allIds
      allIds.forEach(id => { if (!order.includes(id)) order.push(id) })
      const fromIdx = order.indexOf(active.id)
      const toIdx = order.indexOf(over.id)
      if (fromIdx === -1 || toIdx === -1) return prev
      const newOrder = arrayMove(order, fromIdx, toIdx)
      localStorage.setItem(NOTE_ORDER_KEY, JSON.stringify(newOrder))
      return newOrder
    })
  }, [notes])

  const handleSectionDragEnd = useCallback(({ active, over }) => {
    if (!over || active.id === over.id) return
    setSectionOrder(prev => {
      const allNames = sections.map(s => s.name)
      let order = prev.length > 0 ? [...prev] : allNames
      allNames.forEach(n => { if (!order.includes(n)) order.push(n) })
      const fromIdx = order.indexOf(String(active.id))
      const toIdx = order.indexOf(String(over.id))
      if (fromIdx === -1 || toIdx === -1) return prev
      const newOrder = arrayMove(order, fromIdx, toIdx)
      localStorage.setItem(SECTION_ORDER_KEY, JSON.stringify(newOrder))
      return newOrder
    })
  }, [sections])

  // ── 기타 ──

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

  const fmt = (iso) => {
    const d = new Date(iso)
    return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
  }

  const isLoggedIn = !!currentProject || isMaster

  // 모바일: 항상 전체 너비로 펼침
  const open = isMobile ? true : isOpen
  const width = isMobile ? '100%' : (open ? sidebarWidth : 48)

  return (
    <aside className="sidebar" style={{ width, transition: isResizing ? 'none' : undefined }}>

      {/* ── 접힌 상태 (데스크탑 전용) ── */}
      {!open && (
        <>
          <div className="sidebar-collapsed-header">
            <button onClick={toggleSidebar} className="sidebar-toggle-btn" title="사이드바 열기">
              <PanelLeftOpen size={15} />
            </button>
          </div>
          <div className="sidebar-collapsed-body">
            {sortedSections.map(section => (
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
      {open && (
        <>
          {!isMobile && <div className="sidebar-resize-handle" onMouseDown={startResize} />}
          <div className="sidebar-header">
            <span className="sidebar-header-title">메모</span>
            {!isMobile && (
              <button onClick={toggleSidebar} className="sidebar-toggle-btn" title="사이드바 닫기">
                <PanelLeftClose size={15} />
              </button>
            )}
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
            <DndContext
              sensors={sectionSensors}
              collisionDetection={closestCenter}
              onDragEnd={handleSectionDragEnd}
            >
              <SortableContext items={sortedSections.map(s => s.name)} strategy={verticalListSortingStrategy}>
                {sortedSections.map(section => (
                  <SortableSection
                    key={section.name}
                    section={section}
                    isCollapsed={collapsedSections.has(section.name)}
                    onToggle={() => toggleSection(section.name)}
                    onCreate={() => onCreate(section.userId)}
                    selectedId={selectedId}
                    onSelect={onSelect}
                    onDelete={onDelete}
                    isLoggedIn={isLoggedIn}
                    fmt={fmt}
                    onNoteDragEnd={handleNoteDragEnd}
                  />
                ))}
              </SortableContext>
            </DndContext>
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
