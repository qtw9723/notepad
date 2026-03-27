import { useState, useCallback, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import Editor from './components/Editor'
import LoginPage from './components/LoginPage'
import { useNotes } from './hooks/useNotes'
import { useAuth } from './hooks/useAuth'
import { useProjects } from './hooks/useProjects'

export default function App() {
  const { user, signIn, signOut } = useAuth()
  const { projects } = useProjects()
  const { notes, loading, createNote, updateNote, deleteNote } = useNotes(user)
  const [selectedId, setSelectedId] = useState(null)
  const [showLoginModal, setShowLoginModal] = useState(false)

  // 로그인된 유저의 프로젝트 정보
  const currentProject = user ? (projects.find(p => p.user_id === user.id) ?? null) : null
  const isMaster = currentProject?.is_master ?? false

  // 로그인 성공 시 모달 닫기
  useEffect(() => {
    if (user) setShowLoginModal(false)
  }, [user])

  const handleCreate = async () => {
    const note = await createNote()
    if (note) setSelectedId(note.id)
  }

  const handleDelete = async (id) => {
    await deleteNote(id)
    if (selectedId === id) setSelectedId(null)
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

  return (
    <div className="flex h-full bg-[#0d1117]">
      <Sidebar
        notes={notes}
        projects={projects}
        currentProject={currentProject}
        isMaster={isMaster}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onCreate={handleCreate}
        onDelete={handleDelete}
        onSignOut={signOut}
        onShowLogin={() => setShowLoginModal(true)}
      />
      <main className="flex-1 flex flex-col overflow-hidden">
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-[#484f58] text-sm animate-pulse">
            불러오는 중...
          </div>
        ) : (
          <Editor
            key={selectedId}
            noteId={selectedId}
            onUpdate={handleUpdate}
            isLoggedIn={isMaster || !!currentProject}
          />
        )}
      </main>

      {showLoginModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{
            backgroundColor: '#0d1117',
            backgroundImage: `
              radial-gradient(ellipse 60% 50% at 50% 40%, rgba(157,143,252,0.12) 0%, transparent 70%),
              radial-gradient(rgba(157,143,252,0.07) 1px, transparent 1px)
            `,
            backgroundSize: '100% 100%, 20px 20px',
          }}
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
