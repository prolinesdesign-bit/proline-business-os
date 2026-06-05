import { supabase } from '../supabase'
import type { Target, TargetFormData, TargetProgress } from '../../types'

export async function getTargets(): Promise<Target[]> {
  const { data, error } = await supabase
    .from('targets')
    .select('*')
    .order('start_date', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function createTarget(data: TargetFormData): Promise<Target> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: target, error } = await supabase
    .from('targets')
    .insert({
      user_id: user.id,
      title: data.title,
      target_type: 'revenue',
      target_value: Number(data.target_value),
      current_value: 0,
      start_date: data.start_date,
      end_date: data.end_date,
      status: 'active',
    })
    .select()
    .single()

  if (error) throw error
  return target
}

export async function updateTarget(id: string, data: TargetFormData): Promise<Target> {
  const { data: target, error } = await supabase
    .from('targets')
    .update({
      title: data.title,
      target_value: Number(data.target_value),
      start_date: data.start_date,
      end_date: data.end_date,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return target
}

export async function deleteTarget(id: string): Promise<void> {
  const { error } = await supabase.from('targets').delete().eq('id', id)
  if (error) throw error
}

export async function getTargetProgress(): Promise<TargetProgress | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)

  const [targetsRes, paymentsRes] = await Promise.all([
    supabase
      .from('targets')
      .select('*')
      .eq('target_type', 'revenue')
      .eq('user_id', user.id)
      .lte('start_date', monthEnd)
      .gte('end_date', monthStart)
      .order('created_at', { ascending: false })
      .limit(1),
    supabase
      .from('payments')
      .select('amount')
      .eq('status', 'completed')
      .gte('payment_date', monthStart)
      .lte('payment_date', monthEnd),
  ])

  if (targetsRes.error) throw targetsRes.error
  if (paymentsRes.error) throw paymentsRes.error

  const target = targetsRes.data?.[0] ?? null
  const currentRevenue = (paymentsRes.data ?? []).reduce((s, p) => s + Number(p.amount), 0)

  if (!target) {
    return {
      target: null,
      currentRevenue,
      remaining: 0,
      percentage: 0,
      dailyNeeded: 0,
    }
  }

  const targetVal = Number(target.target_value)
  const remaining = Math.max(0, targetVal - currentRevenue)
  const percentage = targetVal > 0 ? Math.min(100, Math.round((currentRevenue / targetVal) * 100)) : 0

  const daysLeft = Math.ceil(
    (new Date(monthEnd).getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  )
  const dailyNeeded = daysLeft > 0 && remaining > 0 ? remaining / daysLeft : 0

  return {
    target,
    currentRevenue,
    remaining,
    percentage,
    dailyNeeded: Math.round(dailyNeeded * 100) / 100,
  }
}
