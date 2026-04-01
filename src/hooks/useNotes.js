import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'

export function useNotes(user) {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchNotes = useCallback(async () => {
    setLoading(true)
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
    if (user !== undefined) {
      fetchNotes()
    }
  }, [user, fetchNotes])

  const createNote = async (targetUserId) => {
    const body = { title: '새 메모', content: '', content_type: 'markdown', tags: [] }
    if (targetUserId) body.user_id = targetUserId
    const note = await api.createNote(body)
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
