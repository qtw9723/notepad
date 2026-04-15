import { useState, useEffect, useCallback } from 'react'
import { todoApi } from '../lib/todoApi'

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
      .filter(i => i.list_id === listId)
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
