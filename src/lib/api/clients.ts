import { supabase } from '../supabase'
import type { Client, ClientFormData, ClientStats } from '../../types'

export async function getClients(search: string): Promise<(Client & { stats: ClientStats })[]> {
  let query = supabase
    .from('clients')
    .select('*')
    .order('name', { ascending: true })

  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,company.ilike.%${search}%`)
  }

  const { data: clients, error } = await query
  if (error) throw error

  const clientIds = (clients ?? []).map(c => c.id)

  if (clientIds.length === 0) return []

  const { data: projects } = await supabase
    .from('projects')
    .select('client_id, budget')
    .in('client_id', clientIds)

  const grouped = new Map<string, { count: number; total: number }>()
  for (const p of projects ?? []) {
    if (!p.client_id) continue
    const g = grouped.get(p.client_id) ?? { count: 0, total: 0 }
    g.count++
    g.total += p.budget ?? 0
    grouped.set(p.client_id, g)
  }

  return (clients ?? []).map(c => ({
    ...c,
    stats: grouped.has(c.id)
      ? grouped.get(c.id)!
      : { project_count: 0, total_value: 0 },
  }))
}

export async function createClient(data: ClientFormData): Promise<Client> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: client, error } = await supabase
    .from('clients')
    .insert({
      user_id: user.id,
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      company: data.location || null,
      whatsapp: data.whatsapp || null,
      notes: data.notes || null,
    })
    .select()
    .single()

  if (error) throw error
  return client
}

export async function updateClient(id: string, data: ClientFormData): Promise<Client> {
  const { data: client, error } = await supabase
    .from('clients')
    .update({
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      company: data.location || null,
      whatsapp: data.whatsapp || null,
      notes: data.notes || null,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return client
}

export async function deleteClient(id: string): Promise<void> {
  const { error } = await supabase.from('clients').delete().eq('id', id)
  if (error) throw error
}
