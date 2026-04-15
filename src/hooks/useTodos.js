import { useState, useEffect, useCallback, useMemo } from 'react'
import { todoApi } from '../lib/todoApi'

// 주기 항목이 현재 노출되어야 하는지 판단
function isRecurringVisible(item) {
  if (!item.recurrence || item.recurrence === 'none') return true

  const now = new Date()
  now.setHours(0, 0, 0, 0)

  // start_date 이전이면 숨김
  if (item.start_date) {
    const start = new Date(item.start_date + 'T00:00:00')
    if (start > now) return false
  }

  if (!item.last_completed_at) return true

  const last = new Date(item.last_completed_at)

  if (item.recurrence === 'daily') {
    const lastDay = new Date(last)
    lastDay.setHours(0, 0, 0, 0)
    return lastDay < now
  }
  if (item.recurrence === 'weekdays') {
    const day = now.getDay()
    if (day === 0 || day === 6) return false // 주말엔 숨김
    const lastDay = new Date(last)
    lastDay.setHours(0, 0, 0, 0)
    return lastDay < now
  }
  if (item.recurrence === 'weekly') {
    return (now - last) >= 7 * 86400000
  }
  if (item.recurrence === 'monthly') {
    const next = new Date(last)
    next.setMonth(next.getMonth() + 1)
    return now >= next
  }
  return true
}

export function useTodos(user) {
  const [lists, setLists] = useState([])
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return }
    if (!import.meta.env.VITE_TODOS_URL) {
      setError('VITE_TODOS_URL 환경변수가 설정되지 않았습니다')
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      const [listsData, itemsData] = await Promise.all([
        todoApi.getLists(),
        todoApi.getItems(),
      ])
      setLists(listsData)
      setItems(itemsData)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { load() }, [load])

  const createList = useCallback(async (title, color = '#9d8ffc') => {
    const list = await todoApi.createList(title, color)
    setLists(prev => [...prev, list])
    return list
  }, [])

  const updateList = useCallback(async (id, changes) => {
    const updated = await todoApi.updateList(id, changes)
    setLists(prev => prev.map(l => l.id === id ? updated : l))
    return updated
  }, [])

  const deleteList = useCallback(async (id) => {
    await todoApi.deleteList(id)
    setLists(prev => prev.filter(l => l.id !== id))
    setItems(prev => prev.filter(i => i.list_id !== id))
  }, [])

  const createItem = useCallback(async (listId, data) => {
    const item = await todoApi.createItem(listId, data)
    setItems(prev => [...prev, item])
    return item
  }, [])

  const updateItem = useCallback(async (id, changes) => {
    const updated = await todoApi.updateItem(id, changes)
    setItems(prev => prev.map(i => i.id === id ? updated : i))
    return updated
  }, [])

  const deleteItem = useCallback(async (id) => {
    await todoApi.deleteItem(id)
    setItems(prev => prev.filter(i => i.id !== id))
  }, [])

  const reorderItems = useCallback(async (reordered) => {
    setItems(prev => {
      const map = new Map(reordered.map(r => [r.id, r.order_index]))
      return prev.map(i => map.has(i.id) ? { ...i, order_index: map.get(i.id) } : i)
    })
    await todoApi.reorderItems(reordered)
  }, [])

  const getItemsByList = useCallback((listId) => {
    return items
      .filter(i => i.list_id === listId && isRecurringVisible(i))
      .sort((a, b) => a.order_index - b.order_index)
  }, [items])

  return {
    lists,
    items,
    loading,
    error,
    reload: load,
    createList,
    updateList,
    deleteList,
    createItem,
    updateItem,
    deleteItem,
    reorderItems,
    getItemsByList,
  }
}
