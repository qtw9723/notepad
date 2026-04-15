import { supabase } from './supabase'

const BASE = import.meta.env.VITE_TODOS_URL

async function req(path = '', options = {}) {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token ?? import.meta.env.VITE_SUPABASE_ANON_KEY
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  return res.json()
}

export const todoApi = {
  getLists: () => req('?type=lists'),
  createList: (title, color) => req('?type=list', { method: 'POST', body: JSON.stringify({ title, color }) }),
  updateList: (id, changes) => req(`?id=${id}&type=list`, { method: 'PATCH', body: JSON.stringify(changes) }),
  deleteList: (id) => req(`?id=${id}&type=list`, { method: 'DELETE' }),

  getItems: (listId) => req(listId ? `?type=items&listId=${listId}` : '?type=items'),
  createItem: (listId, data) => req('?type=item', { method: 'POST', body: JSON.stringify({ list_id: listId, ...data }) }),
  updateItem: (id, changes) => req(`?id=${id}&type=item`, { method: 'PATCH', body: JSON.stringify(changes) }),
  deleteItem: (id) => req(`?id=${id}&type=item`, { method: 'DELETE' }),
  reorderItems: (items) => req('', { method: 'POST', body: JSON.stringify({ action: 'reorder', items }) }),

  pushSubscribe: (sub) => req('', { method: 'POST', body: JSON.stringify({ action: 'push-subscribe', ...sub }) }),
  pushUnsubscribe: (endpoint) => req('', { method: 'POST', body: JSON.stringify({ action: 'push-unsubscribe', endpoint }) }),
}
