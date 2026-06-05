import { useEffect, useState, useCallback } from 'react'
import { getProposals, createProposal, updateProposal, deleteProposal, updateProposalStatus } from '../lib/api/proposals'
import AppLayout from '../components/layout/AppLayout'
import { generateWhatsAppUrl } from '../lib/api/followups'
import { supabase } from '../lib/supabase'
import type { Proposal, ProposalFormData, ProposalWithRelations, ProposalStatus } from '../types'
import { TEMPLATE_LABELS } from '../types'
import ProposalForm from '../components/proposals/ProposalForm'
import ProposalPreview from '../components/proposals/ProposalPreview'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { toast } from 'sonner'
import { CardSkeleton } from '../components/ui/Skeleton'
import { EmptyState } from '../components/ui/EmptyState'

const statusBadge: Record<ProposalStatus, 'secondary' | 'default' | 'success' | 'destructive'> = {
  draft: 'secondary',
  sent: 'default',
  accepted: 'success',
  rejected: 'destructive',
}

const STATUS_TRANSITIONS: { from: ProposalStatus; to: ProposalStatus; label: string }[] = [
  { from: 'draft', to: 'sent', label: 'Mark Sent' },
  { from: 'sent', to: 'accepted', label: 'Accept' },
  { from: 'sent', to: 'rejected', label: 'Reject' },
]

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function fmtCost(n: number) {
  return `₹${Math.round(n).toLocaleString()}`
}

export default function Proposals() {
  const [proposals, setProposals] = useState<ProposalWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Proposal | null>(null)
  const [deleting, setDeleting] = useState<ProposalWithRelations | null>(null)
  const [preview, setPreview] = useState<ProposalWithRelations | null>(null)
  const [clientWhatsapp, setClientWhatsapp] = useState<Record<string, string>>({})

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getProposals()
      setProposals(data)

      const ids = data.map(p => p.client_id).filter(Boolean) as string[]
      if (ids.length > 0) {
        const { data: clients } = await supabase
          .from('clients')
          .select('id, whatsapp, phone, name')
          .in('id', ids)
        const map: Record<string, string> = {}
        for (const c of clients ?? []) {
          map[c.id] = c.whatsapp || c.phone
        }
        setClientWhatsapp(map)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  async function handleSave(data: ProposalFormData) {
    try {
      if (editing) {
        await updateProposal(editing.id, data)
      } else {
        await createProposal(data)
      }
      setShowForm(false)
      setEditing(null)
      fetch()
      toast.success('Proposal saved')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save proposal')
    }
  }

  async function handleDelete() {
    if (!deleting) return
    try {
      await deleteProposal(deleting.id)
      setDeleting(null)
      fetch()
      toast.success('Proposal deleted')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete proposal')
    }
  }

  async function handleStatusChange(id: string, status: ProposalStatus) {
    try {
      await updateProposalStatus(id, status)
      fetch()
      toast.success('Status updated')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update status')
    }
  }

  function whatsappProposal(p: ProposalWithRelations) {
    const phone = clientWhatsapp[p.client_id]
    if (!phone) return
    const label = TEMPLATE_LABELS[p.template]
    const msg = `Dear ${p.client_name}, your ${label} (Ref: ${p.proposal_number}) has been prepared with a fee of ₹${Number(p.fee_amount).toLocaleString()}. Please review and share your confirmation. - Proline Architects`
    const url = generateWhatsAppUrl(phone, msg)
    window.open(url, '_blank')
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold">Proposals</h1>
          <Button onClick={() => setShowForm(true)}>
            + New Proposal
          </Button>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2"><CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>
        ) : proposals.length === 0 ? (
          <EmptyState title="No proposals yet" description="Create your first proposal to get started." />
        ) : (
          <div className="space-y-3">
            {proposals.map(p => (
              <Card key={p.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{TEMPLATE_LABELS[p.template]}</span>
                        <Badge variant={statusBadge[p.status]}>{p.status}</Badge>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span>{p.proposal_number}</span>
                        <span>Client: {p.client_name}</span>
                        {p.project_name && <span>Project: {p.project_name}</span>}
                        <span>Fee: {fmtCost(p.fee_amount)}</span>
                        <span>{formatDate(p.created_at)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {STATUS_TRANSITIONS
                        .filter(t => t.from === p.status)
                        .map(t => (
                          <Button
                            key={t.to}
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusChange(p.id, t.to)}
                          >
                            {t.label}
                          </Button>
                        ))}
                      {clientWhatsapp[p.client_id] && (
                        <Button variant="success" size="sm" onClick={() => whatsappProposal(p)}>
                          WhatsApp
                        </Button>
                      )}
                      <Button variant="default" size="sm" onClick={() => setPreview(p)}>
                        Preview PDF
                      </Button>
                      <Button variant="link" size="sm" onClick={() => { setEditing(p); setShowForm(true) }}>Edit</Button>
                      <Button variant="link" size="sm" className="text-destructive" onClick={() => setDeleting(p)}>Delete</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <ProposalForm
          proposal={editing}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditing(null) }}
        />
      )}

      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-sm">
            <CardHeader>
              <CardTitle>Delete Proposal</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Delete {TEMPLATE_LABELS[deleting.template]} ({deleting.proposal_number})? This cannot be undone.
              </p>
              <div className="mt-5 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button>
                <Button variant="destructive" onClick={handleDelete}>Delete</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {preview && (
        <ProposalPreview
          proposal={preview}
          onClose={() => setPreview(null)}
        />
      )}
    </AppLayout>
  )
}
