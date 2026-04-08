import { supabase } from './supabase'

const BUCKET = 'note-images'

export async function uploadImage(noteId, file) {
  const ext = file.name.split('.').pop() || 'png'
  const uid = crypto.randomUUID()
  const path = `images/${noteId}/${uid}.${ext}`

  const { error } = await supabase.storage.from(BUCKET).upload(path, file)
  if (error) throw error

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

export async function deleteNoteImages(noteId) {
  const { data: files } = await supabase.storage
    .from(BUCKET)
    .list(`images/${noteId}`)
  if (!files?.length) return
  const paths = files.map(f => `images/${noteId}/${f.name}`)
  await supabase.storage.from(BUCKET).remove(paths)
}
