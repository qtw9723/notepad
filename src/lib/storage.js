import { supabase } from './supabase'

const BUCKET = 'note-images'
const STORAGE_PREFIX = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/`

function extractStoragePaths(content) {
  const paths = []
  for (const match of (content || '').matchAll(/!\[.*?\]\((https?:\/\/[^)]+)\)/g)) {
    if (match[1].startsWith(STORAGE_PREFIX)) {
      paths.push(match[1].slice(STORAGE_PREFIX.length))
    }
  }
  return paths
}

export function findRemovedStoragePaths(oldContent, newContent) {
  const oldPaths = extractStoragePaths(oldContent)
  const newPathSet = new Set(extractStoragePaths(newContent))
  return oldPaths.filter(p => !newPathSet.has(p))
}

export async function deleteImagePaths(paths) {
  if (!paths.length) return
  await supabase.storage.from(BUCKET).remove(paths)
}

export async function uploadImage(noteId, file) {
  const ext = file.name.split('.').pop() || 'png'
  const uid = crypto.randomUUID()
  const path = `public/${noteId}/${uid}.${ext}`

  const { error } = await supabase.storage.from(BUCKET).upload(path, file)
  if (error) throw error

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

export async function deleteNoteImages(noteId) {
  const { data: files } = await supabase.storage
    .from(BUCKET)
    .list(`public/${noteId}`)
  if (!files?.length) return
  const paths = files.map(f => `public/${noteId}/${f.name}`)
  await supabase.storage.from(BUCKET).remove(paths)
}
