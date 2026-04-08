import { useState, useEffect, useCallback, useRef } from 'react'
import { api } from '../lib/api'
import { deleteNoteImages } from '../lib/storage'

export function useNotes(user) {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(false)
  const contentCache = useRef(new Map())

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

  const fetchNote = useCallback(async (id) => {
    if (contentCache.current.has(id)) return contentCache.current.get(id)
    const data = await api.getNote(id)
    if (data) contentCache.current.set(id, data)
    return data
  }, [])

  const createNote = async (targetUserId) => {
    const tempId = `temp-${Date.now()}`
    const tempNote = {
      id: tempId,
      title: '새 메모',
      content: '',
      content_type: 'markdown',
      tags: [],
      user_id: targetUserId ?? null,
      updated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    }
    setNotes(prev => [tempNote, ...prev])

    try {
      const body = { title: '새 메모', content: '', content_type: 'markdown', tags: [] }
      if (targetUserId) body.user_id = targetUserId
      const note = await api.createNote(body)
      if (note) {
        contentCache.current.set(note.id, note)
        setNotes(prev => prev.map(n => n.id === tempId ? note : n))
        return note
      }
    } catch (e) {
      setNotes(prev => prev.filter(n => n.id !== tempId))
      console.error('Failed to create note:', e)
    }
    return null
  }

  const updateNote = async (id, changes) => {
    const note = await api.updateNote(id, changes)
    if (note) {
      contentCache.current.set(id, note)
      setNotes(prev => prev.map(n => n.id === id ? { ...n, ...note } : n))
    }
  }

  const deleteNote = async (id) => {
    await deleteNoteImages(id).catch(err => console.error('Storage 정리 실패:', err))
    await api.deleteNote(id)
    contentCache.current.delete(id)
    setNotes(prev => prev.filter(n => n.id !== id))
  }

  return { notes, loading, fetchNotes, fetchNote, createNote, updateNote, deleteNote }
}
