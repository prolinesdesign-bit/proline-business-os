import { supabase } from '../supabase'
import type { FollowUp, FollowUpFormData, FollowUpWithClient } from '../../types'

export async function getFollowUps(status?: string): Promise<FollowUpWithClient[]> {
  let query = supabase
    .from('follow_ups')
    .select('*, clients(name, phone)')
    .order('next_follow_up_date', { ascending: true })

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query
  if (error) throw error

  return (data ?? []).map((f: Record<string, unknown>) => ({
    id: f.id as string,
    created_at: f.created_at as string,
    updated_at: f.updated_at as string,
    user_id: f.user_id as string,
    client_id: f.client_id as string,
    next_follow_up_date: f.next_follow_up_date as string | null,
    last_follow_up_date: f.last_follow_up_date as string | null,
    notes: f.notes as string | null,
    status: f.status as FollowUp['status'],
    client_name: (f.clients as Record<string, unknown>)?.name as string,
    client_whatsapp: (f.clients as Record<string, unknown>)?.phone as string | null,
  }))
}

export async function getFollowUpsByClient(clientId: string): Promise<FollowUpWithClient[]> {
  const { data, error } = await supabase
    .from('follow_ups')
    .select('*, clients(name, phone)')
    .eq('client_id', clientId)
    .order('next_follow_up_date', { ascending: true })

  if (error) throw error

  return (data ?? []).map((f: Record<string, unknown>) => ({
    id: f.id as string,
    created_at: f.created_at as string,
    updated_at: f.updated_at as string,
    user_id: f.user_id as string,
    client_id: f.client_id as string,
    next_follow_up_date: f.next_follow_up_date as string | null,
    last_follow_up_date: f.last_follow_up_date as string | null,
    notes: f.notes as string | null,
    status: f.status as FollowUp['status'],
    client_name: (f.clients as Record<string, unknown>)?.name as string,
    client_whatsapp: (f.clients as Record<string, unknown>)?.phone as string | null,
  }))
}

export async function createFollowUp(data: FollowUpFormData): Promise<FollowUp> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: followUp, error } = await supabase
    .from('follow_ups')
    .insert({
      user_id: user.id,
      client_id: data.client_id,
      next_follow_up_date: data.next_follow_up_date || null,
      last_follow_up_date: data.last_follow_up_date || null,
      notes: data.notes || null,
      status: data.status,
    })
    .select()
    .single()

  if (error) throw error
  return followUp
}

export async function updateFollowUp(id: string, data: FollowUpFormData): Promise<FollowUp> {
  const { data: followUp, error } = await supabase
    .from('follow_ups')
    .update({
      client_id: data.client_id,
      next_follow_up_date: data.next_follow_up_date || null,
      last_follow_up_date: data.last_follow_up_date || null,
      notes: data.notes || null,
      status: data.status,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return followUp
}

export async function deleteFollowUp(id: string): Promise<void> {
  const { error } = await supabase.from('follow_ups').delete().eq('id', id)
  if (error) throw error
}

export function generateWhatsAppUrl(phone: string, message: string): string {
  let cleaned = phone.replace(/\D/g, '')
  // Default to India (+91) if number is 10 digits without country code
  if (cleaned.length === 10) {
    cleaned = '91' + cleaned
  }
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`
}
