import { supabase } from '../supabase'
import type { Task, TaskFormData, TaskWithProject } from '../../types'

export async function getTasks(projectId?: string): Promise<TaskWithProject[]> {
  let query = supabase
    .from('tasks')
    .select('*, projects(name)')
    .order('created_at', { ascending: false })

  if (projectId) {
    query = query.eq('project_id', projectId)
  }

  const { data, error } = await query
  if (error) throw error

  return (data ?? []).map((t: Record<string, unknown>) => ({
    id: t.id as string,
    created_at: t.created_at as string,
    updated_at: t.updated_at as string,
    user_id: t.user_id as string,
    title: t.title as string,
    description: t.description as string | null,
    status: t.status as Task['status'],
    priority: t.priority as Task['priority'],
    due_date: t.due_date as string | null,
    project_id: t.project_id as string | null,
    project_name: (t.projects as Record<string, unknown> | undefined)?.name as string | null,
  }))
}

export async function createTask(data: TaskFormData): Promise<Task> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: task, error } = await supabase
    .from('tasks')
    .insert({
      user_id: user.id,
      title: data.title,
      description: data.description || null,
      priority: data.priority,
      due_date: data.due_date || null,
      project_id: data.project_id || null,
    })
    .select()
    .single()

  if (error) throw error
  return task
}

export async function updateTask(id: string, data: TaskFormData): Promise<Task> {
  const { data: task, error } = await supabase
    .from('tasks')
    .update({
      title: data.title,
      description: data.description || null,
      priority: data.priority,
      due_date: data.due_date || null,
      project_id: data.project_id || null,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return task
}

export async function updateTaskStatus(id: string, status: Task['status']): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .update({ status })
    .eq('id', id)

  if (error) throw error
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase.from('tasks').delete().eq('id', id)
  if (error) throw error
}
