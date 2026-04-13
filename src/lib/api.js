import { supabase } from './supabase'

const BASE_URL = import.meta.env.VITE_NOTEPAD_URL

async function request(path = '', options = {}) {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token ?? import.meta.env.VITE_SUPABASE_ANON_KEY

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
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
  getProjects: () => request('?type=projects'),
  getNotes: () => request(),
  getNote: (id) => request(`?id=${id}`),
  createNote: (body) => request('', { method: 'POST', body: JSON.stringify(body) }),
  updateNote: (id, changes) => request(`?id=${id}`, { method: 'PATCH', body: JSON.stringify(changes) }),
  deleteNote: (id) => request(`?id=${id}`, { method: 'DELETE' }),
  getVersions: (noteId) => request(`?action=versions&noteId=${noteId}`),
  saveSnapshot: (noteId, note) => request('', {
    method: 'POST',
    body: JSON.stringify({ action: 'snapshot', noteId, ...note }),
  }),
  restoreVersion: (noteId, versionId) => request('', {
    method: 'POST',
    body: JSON.stringify({ action: 'restore', noteId, versionId }),
  }),
  r2Presign: (path, contentType) => request('', {
    method: 'POST',
    body: JSON.stringify({ action: 'r2-presign', path, contentType }),
  }),
  r2Delete: (paths) => request('', {
    method: 'POST',
    body: JSON.stringify({ action: 'r2-delete', paths }),
  }),
  r2DeleteFolder: (noteId) => request('', {
    method: 'POST',
    body: JSON.stringify({ action: 'r2-delete-folder', noteId }),
  }),
}
