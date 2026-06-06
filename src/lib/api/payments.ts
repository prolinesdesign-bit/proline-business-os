import { supabase } from '../supabase'
import type { Payment, PaymentFormData, ProjectPaymentSummary } from '../../types'

export async function getPayments(): Promise<Payment[]> {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .order('payment_date', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function getProjectSummaries(): Promise<ProjectPaymentSummary[]> {
  const { data: projects, error: projectError } = await supabase
    .from('projects')
    .select('id, name, budget')

  if (projectError) throw projectError

  const projectIds = (projects ?? []).map(p => p.id)

  if (projectIds.length === 0) return []

  const { data: payments, error: paymentError } = await supabase
    .from('payments')
    .select('project_id, amount')
    .in('project_id', projectIds)
    .eq('status', 'completed')

  if (paymentError) throw paymentError

  const paidByProject = new Map<string, number>()
  for (const p of payments ?? []) {
    if (!p.project_id) continue
    paidByProject.set(p.project_id, (paidByProject.get(p.project_id) ?? 0) + Number(p.amount))
  }

  return (projects ?? []).map(p => {
    const totalPaid = paidByProject.get(p.id) ?? 0
    const projectValue = Number(p.budget ?? 0)
    return {
      project_id: p.id,
      project_name: p.name,
      project_value: projectValue,
      total_paid: totalPaid,
      balance_due: projectValue - totalPaid,
    }
  })
}

async function resolveClientId(projectId: string, userId: string): Promise<string> {
  const { data: project } = await supabase
    .from('projects')
    .select('client_id, client_name')
    .eq('id', projectId)
    .single()

  if (project?.client_id) return project.client_id

  if (project?.client_name) {
    const { data: existing } = await supabase
      .from('clients')
      .select('id')
      .eq('name', project.client_name)
      .eq('user_id', userId)
      .maybeSingle()

    if (existing) return existing.id

    const { data: created, error } = await supabase
      .from('clients')
      .insert({ user_id: userId, name: project.client_name })
      .select('id')
      .single()

    if (!error && created) return created.id
  }

  const { data: fallback, error } = await supabase
    .from('clients')
    .insert({ user_id: userId, name: 'Unknown Client' })
    .select('id')
    .single()

  if (error || !fallback) throw new Error('Could not resolve a client for this payment.')
  return fallback.id
}

export async function createPayment(data: PaymentFormData): Promise<Payment> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const clientId = await resolveClientId(data.project_id, user.id)

  const { data: payment, error } = await supabase
    .from('payments')
    .insert({
      user_id: user.id,
      project_id: data.project_id,
      client_id: clientId,
      amount: Number(data.amount),
      payment_date: data.payment_date,
      description: data.description || null,
      method: data.method || 'bank_transfer',
      status: data.status || 'completed',
      currency: 'INR',
    })
    .select()
    .single()

  if (error) throw error
  return payment
}

export async function updatePayment(id: string, data: PaymentFormData): Promise<Payment> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const clientId = await resolveClientId(data.project_id, user.id)

  const { data: payment, error } = await supabase
    .from('payments')
    .update({
      project_id: data.project_id,
      client_id: clientId,
      amount: Number(data.amount),
      payment_date: data.payment_date,
      description: data.description || null,
      method: data.method || 'bank_transfer',
      status: data.status || 'completed',
      currency: 'INR',
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return payment
}

export async function deletePayment(id: string): Promise<void> {
  const { error } = await supabase.from('payments').delete().eq('id', id)
  if (error) throw error
}
