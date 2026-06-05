import { supabase } from '../supabase'
import type { Document } from '../../types'

export async function getDocuments(projectId?: string): Promise<Document[]> {
  let query = supabase
    .from('documents')
    .select('*')
    .order('created_at', { ascending: false })

  if (projectId) {
    query = query.eq('project_id', projectId)
  }

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function getDocumentCounts(): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('documents')
    .select('project_id')

  if (error) throw error

  const counts: Record<string, number> = {}
  for (const d of data ?? []) {
    if (d.project_id) {
      counts[d.project_id] = (counts[d.project_id] ?? 0) + 1
    }
  }
  return counts
}

export async function uploadDocument(
  file: File,
  projectId: string | null,
  notes: string,
): Promise<Document> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const fileExt = file.name.split('.').pop()
  const storagePath = `${user.id}/${crypto.randomUUID()}.${fileExt}`

  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(storagePath, file)

  if (uploadError) throw uploadError

  const { data: doc, error: dbError } = await supabase
    .from('documents')
    .insert({
      user_id: user.id,
      project_id: projectId || null,
      name: file.name,
      file_type: file.type,
      file_size: file.size,
      storage_path: storagePath,
      notes: notes || null,
    })
    .select()
    .single()

  if (dbError) {
    await supabase.storage.from('documents').remove([storagePath])
    throw dbError
  }

  return doc
}

export async function deleteDocument(id: string): Promise<void> {
  const { data: doc, error: fetchError } = await supabase
    .from('documents')
    .select('storage_path')
    .eq('id', id)
    .single()

  if (fetchError) throw fetchError

  const { error: storageError } = await supabase.storage
    .from('documents')
    .remove([doc.storage_path])

  if (storageError) throw storageError

  const { error: dbError } = await supabase
    .from('documents')
    .delete()
    .eq('id', id)

  if (dbError) throw dbError
}

export async function getDocumentDownloadUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('documents')
    .createSignedUrl(storagePath, 60)

  if (error) throw error
  return data.signedUrl
}
