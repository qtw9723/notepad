import { useState, useCallback } from 'react'
import Sidebar from './components/Sidebar'
import Editor from './components/Editor'
import { useNotes } from './hooks/useNotes'

export default function App() {
  const { notes, loading, createNote, updateNote, deleteNote } = useNotes()
  const [selectedId, setSelectedId] = useState(null)

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

  return (
    <div className="flex h-full bg-[#0f0f10]">
      <Sidebar
        notes={notes}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onCreate={handleCreate}
        onDelete={handleDelete}
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
    </div>
  )
}
