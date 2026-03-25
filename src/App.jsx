import { useState, useCallback, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import Editor from './components/Editor'
import LoginPage from './components/LoginPage'
import { useNotes } from './hooks/useNotes'
import { useAuth } from './hooks/useAuth'

export default function App() {
  const { user, signIn, signUp, signOut } = useAuth()
  const { notes, loading, createNote, updateNote, deleteNote } = useNotes(user)
  const [selectedId, setSelectedId] = useState(null)
  const [showLoginModal, setShowLoginModal] = useState(false)

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
      <div className="flex h-full items-center justify-center bg-[#0f0f10] text-[#404050] text-sm animate-pulse">
        불러오는 중...
      </div>
    )
  }

  return (
    <div className="flex h-full bg-[#0f0f10]">
      <Sidebar
        notes={notes}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onCreate={handleCreate}
        onDelete={handleDelete}
        onSignOut={signOut}
        userEmail={user?.email ?? null}
        onShowLogin={() => setShowLoginModal(true)}
      />
      <main className="flex-1 flex flex-col overflow-hidden">
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-[#404050] text-sm animate-pulse">
            불러오는 중...
          </div>
        ) : (
          <Editor
            key={selectedId}
            noteId={selectedId}
            onUpdate={handleUpdate}
          />
        )}
      </main>

      {showLoginModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setShowLoginModal(false) }}
        >
          <LoginPage
            onSignIn={signIn}
            onSignUp={signUp}
            onClose={() => setShowLoginModal(false)}
          />
        </div>
      )}
    </div>
  )
}
