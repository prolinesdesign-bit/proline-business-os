import { supabase } from '../supabase'
import type { Proposal, ProposalFormData, ProposalWithRelations, ProposalTemplate, ProposalStatus } from '../../types'

function generateProposalNumber(): string {
  const year = new Date().getFullYear()
  const rand = Math.floor(1000 + Math.random() * 9000)
  return `PRL-${year}-${rand}`
}

export async function getProposals(): Promise<ProposalWithRelations[]> {
  const { data, error } = await supabase
    .from('proposals')
    .select('*, clients(name), projects(name)')
    .order('created_at', { ascending: false })

  if (error) throw error

  return (data ?? []).map((p: Record<string, unknown>) => ({
    id: p.id as string,
    created_at: p.created_at as string,
    updated_at: p.updated_at as string,
    user_id: p.user_id as string,
    client_id: p.client_id as string,
    project_id: p.project_id as string | null,
    template: p.template as ProposalTemplate,
    proposal_number: p.proposal_number as string,
    fee_amount: Number(p.fee_amount),
    scope_of_work: p.scope_of_work as string,
    deliverables: p.deliverables as string,
    timeline: p.timeline as string,
    terms_conditions: p.terms_conditions as string,
    status: p.status as ProposalStatus,
    client_name: (p.clients as Record<string, unknown> | null)?.name as string ?? 'Unknown',
    project_name: (p.projects as Record<string, unknown> | null)?.name as string | null,
  }))
}

export async function createProposal(data: ProposalFormData): Promise<Proposal> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: p, error } = await supabase
    .from('proposals')
    .insert({
      user_id: user.id,
      client_id: data.client_id,
      project_id: data.project_id || null,
      template: data.template,
      proposal_number: generateProposalNumber(),
      fee_amount: data.fee_amount ? Number(data.fee_amount) : 0,
      scope_of_work: data.scope_of_work,
      deliverables: data.deliverables,
      timeline: data.timeline,
      terms_conditions: data.terms_conditions,
    })
    .select()
    .single()

  if (error) throw error
  return p
}

export async function updateProposal(id: string, data: ProposalFormData): Promise<Proposal> {
  const { data: p, error } = await supabase
    .from('proposals')
    .update({
      client_id: data.client_id,
      project_id: data.project_id || null,
      template: data.template,
      fee_amount: data.fee_amount ? Number(data.fee_amount) : 0,
      scope_of_work: data.scope_of_work,
      deliverables: data.deliverables,
      timeline: data.timeline,
      terms_conditions: data.terms_conditions,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return p
}

export async function updateProposalStatus(id: string, status: ProposalStatus): Promise<void> {
  const { error } = await supabase
    .from('proposals')
    .update({ status })
    .eq('id', id)

  if (error) throw error
}

export async function deleteProposal(id: string): Promise<void> {
  const { error } = await supabase.from('proposals').delete().eq('id', id)
  if (error) throw error
}
