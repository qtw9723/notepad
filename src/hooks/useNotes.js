import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useNotes() {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchNotes = useCallback(async () => {
    const { data, error } = await supabase
      .from('notes')
      .select('id, title, content_type, tags, created_at, updated_at')
      .order('updated_at', { ascending: false })
    if (!error) setNotes(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchNotes()
  }, [fetchNotes])

  const createNote = async () => {
    const { data, error } = await supabase
      .from('notes')
      .insert({ title: '새 메모', content: '', content_type: 'markdown', tags: [] })
      .select()
      .single()
    if (!error) {
      setNotes(prev => [data, ...prev])
      return data
    }
    return null
  }

  const updateNote = async (id, changes) => {
    const { data, error } = await supabase
      .from('notes')
      .update({ ...changes, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (!error) {
      setNotes(prev => prev.map(n => n.id === id ? { ...n, ...data } : n))
    }
  }

  const deleteNote = async (id) => {
    const { error } = await supabase.from('notes').delete().eq('id', id)
    if (!error) setNotes(prev => prev.filter(n => n.id !== id))
  }

  return { notes, loading, fetchNotes, createNote, updateNote, deleteNote }
}
