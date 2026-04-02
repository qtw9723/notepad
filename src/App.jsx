import { useState, useCallback, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import Editor from './components/Editor'
import LoginPage from './components/LoginPage'
import { useNotes } from './hooks/useNotes'
import { useAuth } from './hooks/useAuth'
import { useProjects } from './hooks/useProjects'
import { useMobile } from './hooks/useMobile'

export default function App() {
  const { user, signIn, signOut } = useAuth()
  const { projects } = useProjects()
  const { notes, loading, fetchNote, createNote, updateNote, deleteNote } = useNotes(user)
  const [selectedId, setSelectedId] = useState(null)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const isMobile = useMobile()
  const [mobileView, setMobileView] = useState('list') // 'list' | 'preview' | 'edit'

  // 로그인된 유저의 프로젝트 정보
  const currentProject = user ? (projects.find(p => p.user_id === user.id) ?? null) : null
  const isMaster = currentProject?.is_master ?? false

  // 로그인 성공 시 모달 닫기
  useEffect(() => {
    if (user) setShowLoginModal(false)
  }, [user])

  // 데스크탑 전환 시 mobileView 리셋
  useEffect(() => {
    if (!isMobile) setMobileView('list')
  }, [isMobile])

  const handleSelect = (id) => {
    setSelectedId(id)
    if (isMobile) setMobileView('preview')
  }

  const handleCreate = async (targetUserId) => {
    const note = await createNote(targetUserId)
    if (note) {
      setSelectedId(note.id)
      if (isMobile) setMobileView('edit')
    }
  }

  const handleDelete = async (id) => {
    await deleteNote(id)
    if (selectedId === id) {
      setSelectedId(null)
      if (isMobile) setMobileView('list')
    }
  }

  const handleUpdate = useCallback((updated) => {
    updateNote(updated.id, updated)
  }, [updateNote])

  // 초기 로딩 (auth 세션 확인 중)
  if (user === undefined) {
    return (
      <div className="flex h-full items-center justify-center bg-[#0d1117] text-[#484f58] text-sm animate-pulse">
        불러오는 중...
      </div>
    )
  }

  const showSidebar = !isMobile || mobileView === 'list'
  const showEditor = !isMobile || mobileView !== 'list'

  return (
    <div className="flex h-full bg-[#0d1117]">
      {showSidebar && (
        <Sidebar
          notes={notes}
          projects={projects}
          currentProject={currentProject}
          isMaster={isMaster}
          selectedId={selectedId}
          onSelect={handleSelect}
          onCreate={handleCreate}
          onDelete={handleDelete}
          onSignOut={signOut}
          onShowLogin={() => setShowLoginModal(true)}
          isMobile={isMobile}
        />
      )}
      {showEditor && (
        <main className="flex-1 flex flex-col overflow-hidden">
          {loading ? (
            <div className="flex-1 flex items-center justify-center text-[#484f58] text-sm animate-pulse">
              불러오는 중...
            </div>
          ) : (
            <Editor
              key={selectedId}
              noteId={selectedId}
              fetchNote={fetchNote}
              onUpdate={handleUpdate}
              isLoggedIn={isMaster || !!currentProject}
              isMobile={isMobile}
              mobileView={mobileView}
              onMobileViewChange={setMobileView}
            />
          )}
        </main>
      )}

      {showLoginModal && (
        <div
          className="login-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) setShowLoginModal(false) }}
        >
          <LoginPage
            projects={projects}
            onSignIn={signIn}
            onClose={() => setShowLoginModal(false)}
          />
        </div>
      )}
    </div>
  )
}
