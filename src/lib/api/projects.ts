import { supabase } from '../supabase'
import type { Project, ProjectFormData } from '../../types'

export async function getProjects(search: string): Promise<Project[]> {
  let query = supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })

  if (search) {
    query = query.or(`name.ilike.%${search}%,client_name.ilike.%${search}%`)
  }

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function createProject(data: ProjectFormData): Promise<Project> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: project, error } = await supabase
    .from('projects')
    .insert({
      user_id: user.id,
      name: data.name,
      description: data.description || null,
      status: data.status,
      client_name: data.client_name || null,
      start_date: data.start_date || null,
      end_date: data.end_date || null,
      budget: data.budget ? Number(data.budget) : null,
    })
    .select()
    .single()

  if (error) throw error
  return project
}

export async function updateProject(id: string, data: ProjectFormData): Promise<Project> {
  const { data: project, error } = await supabase
    .from('projects')
    .update({
      name: data.name,
      description: data.description || null,
      status: data.status,
      client_name: data.client_name || null,
      start_date: data.start_date || null,
      end_date: data.end_date || null,
      budget: data.budget ? Number(data.budget) : null,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return project
}

export async function deleteProject(id: string): Promise<void> {
  const { error } = await supabase.from('projects').delete().eq('id', id)
  if (error) throw error
}
