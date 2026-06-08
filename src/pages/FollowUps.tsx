import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { getFollowUps, createFollowUp, updateFollowUp, deleteFollowUp } from '../lib/api/followups'
import type { FollowUp, FollowUpFormData, FollowUpWithClient, FollowUpStatus } from '../types'
import FollowUpForm from '../components/followups/FollowUpForm'
import WhatsAppModal from '../components/WhatsAppModal'
import AppLayout from '../components/layout/AppLayout'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { toast } from 'sonner'
import { CardSkeleton } from '../components/ui/Skeleton'
import { EmptyState } from '../components/ui/EmptyState'

const statusBadge: Record<FollowUpStatus, 'warning' | 'default' | 'purple' | 'success'> = {
  pending: 'warning',
  contacted: 'default',
  waiting_client: 'purple',
  closed: 'success',
}

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'waiting_client', label: 'Waiting Client' },
  { value: 'closed', label: 'Closed' },
]

function formatDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function FollowUps() {
  const [followUps, setFollowUps] = useState<FollowUpWithClient[]>([])
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<FollowUp | null>(null)
  const [deleting, setDeleting] = useState<FollowUpWithClient | null>(null)
  const [whatsappTarget, setWhatsappTarget] = useState<FollowUpWithClient | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getFollowUps(statusFilter || undefined)
      setFollowUps(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => { fetch() }, [fetch])

  async function handleSave(data: FollowUpFormData) {
    try {
      if (editing) {
        await updateFollowUp(editing.id, data)
      } else {
        await createFollowUp(data)
      }
      setShowForm(false)
      setEditing(null)
      fetch()
      toast.success('Follow-up saved')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save follow-up')
    }
  }

  async function handleDelete() {
    if (!deleting) return
    try {
      await deleteFollowUp(deleting.id)
      setDeleting(null)
      fetch()
      toast.success('Follow-up deleted')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete follow-up')
    }
  }

  function openWhatsApp(fu: FollowUpWithClient) {
    setWhatsappTarget(fu)
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="flex items-center justify-between gap-4 mb-6">
          <h1 className="font-display text-3xl tracking-tight">Follow-ups</h1>
          <Button onClick={() => setShowForm(true)}>
            + New Follow-up
          </Button>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Filter:</span>
          {STATUS_FILTERS.map(sf => (
            <button
              key={sf.value}
              onClick={() => setStatusFilter(sf.value)}
              className={`rounded-full px-3 py-1 text-sm ${
                statusFilter === sf.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-accent'
              }`}
            >
              {sf.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4"><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>
        ) : followUps.length === 0 ? (
          <EmptyState title="No follow-ups yet" description="Follow-ups help you stay on top of client communications." />
        ) : (
          <div className="space-y-3">
            {followUps.map(fu => (
              <Card key={fu.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Link to={`/clients`} className="font-semibold text-primary hover:underline">{fu.client_name}</Link>
                        <Badge variant={statusBadge[fu.status]}>
                          {fu.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span>Next: {formatDate(fu.next_follow_up_date)}</span>
                        <span>Last: {formatDate(fu.last_follow_up_date)}</span>
                      </div>
                      {fu.notes && <p className="mt-1 text-sm text-muted-foreground">{fu.notes}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {fu.client_whatsapp && (
                        <Button variant="success" size="sm" onClick={() => openWhatsApp(fu)}>
                          WhatsApp
                        </Button>
                      )}
                      <Button variant="link" size="sm" onClick={() => { setEditing(fu); setShowForm(true) }}>Edit</Button>
                      <Button variant="link" size="sm" className="text-destructive" onClick={() => setDeleting(fu)}>Delete</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <FollowUpForm
          followUp={editing}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditing(null) }}
        />
      )}

      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-sm">
            <CardHeader>
              <CardTitle>Delete Follow-up</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Delete follow-up for <strong>{deleting.client_name}</strong>? This cannot be undone.
              </p>
              <div className="mt-5 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button>
                <Button variant="destructive" onClick={handleDelete}>Delete</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {whatsappTarget?.client_whatsapp && (
        <WhatsAppModal
          phone={whatsappTarget.client_whatsapp}
          clientName={whatsappTarget.client_name}
          onClose={() => setWhatsappTarget(null)}
        />
      )}
    </AppLayout>
  )
}
