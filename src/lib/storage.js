import { api } from './api'

const R2_PUBLIC_URL = import.meta.env.VITE_R2_PUBLIC_URL

function extractR2Paths(content) {
  const paths = []
  for (const match of (content || '').matchAll(/!\[.*?\]\((https?:\/\/[^)]+)\)/g)) {
    if (match[1].startsWith(R2_PUBLIC_URL + '/')) {
      paths.push(match[1].slice(R2_PUBLIC_URL.length + 1))
    }
  }
  return paths
}

export function findRemovedStoragePaths(oldContent, newContent) {
  const oldPaths = extractR2Paths(oldContent)
  const newPathSet = new Set(extractR2Paths(newContent))
  return oldPaths.filter(p => !newPathSet.has(p))
}

export async function deleteImagePaths(paths) {
  if (!paths.length) return
  await api.r2Delete(paths)
}

export async function uploadImage(noteId, file) {
  const ext = file.name.split('.').pop() || 'png'
  const uid = crypto.randomUUID()
  const path = `public/${noteId}/${uid}.${ext}`

  const { signedUrl, publicUrl } = await api.r2Presign(path, file.type || 'image/png')

  const res = await fetch(signedUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type || 'image/png' },
    body: file,
  })
  if (!res.ok) throw new Error(`R2 upload failed: ${res.status}`)

  return publicUrl
}

export async function deleteNoteImages(noteId) {
  await api.r2DeleteFolder(noteId)
}
