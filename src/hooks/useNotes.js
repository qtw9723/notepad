import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'

export function useNotes() {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchNotes = useCallback(async () => {
    try {
      const data = await api.getNotes()
      setNotes(data || [])
    } catch (e) {
      console.error('Failed to load notes:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNotes()
  }, [fetchNotes])

  const createNote = async () => {
    const note = await api.createNote({ title: '새 메모', content: '', content_type: 'markdown', tags: [] })
    if (note) setNotes(prev => [note, ...prev])
    return note
  }

  const updateNote = async (id, changes) => {
    const note = await api.updateNote(id, changes)
    if (note) setNotes(prev => prev.map(n => n.id === id ? { ...n, ...note } : n))
  }

  const deleteNote = async (id) => {
    await api.deleteNote(id)
    setNotes(prev => prev.filter(n => n.id !== id))
  }

  return { notes, loading, fetchNotes, createNote, updateNote, deleteNote }
}
