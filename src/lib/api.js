const BASE_URL = import.meta.env.VITE_NOTEPAD_URL
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

async function request(path = '', options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ANON_KEY}`,
      ...options.headers,
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  return res.json()
}

export const api = {
  getNotes: () => request(),
  getNote: (id) => request(`?id=${id}`),
  createNote: (body) => request('', { method: 'POST', body: JSON.stringify(body) }),
  updateNote: (id, changes) => request(`?id=${id}`, { method: 'PATCH', body: JSON.stringify(changes) }),
  deleteNote: (id) => request(`?id=${id}`, { method: 'DELETE' }),
}
