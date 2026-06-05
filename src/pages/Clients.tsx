import { useEffect, useState, useCallback } from 'react'
import type { Client, ClientFormData, ClientStats, FollowUpWithClient } from '../types'
import { getClients, createClient, updateClient, deleteClient } from '../lib/api/clients'
import { getFollowUpsByClient } from '../lib/api/followups'
import ClientCard from '../components/clients/ClientCard'
import ClientForm from '../components/clients/ClientForm'
import WhatsAppModal from '../components/WhatsAppModal'
import AppLayout from '../components/layout/AppLayout'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'
import { toast } from 'sonner'
import { CardSkeleton } from '../components/ui/Skeleton'
import { EmptyState } from '../components/ui/EmptyState'

const statusBadge: Record<string, 'warning' | 'default' | 'purple' | 'success'> = {
  pending: 'warning',
  contacted: 'default',
  waiting_client: 'purple',
  closed: 'success',
}

function formatDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function Clients() {
  const [clients, setClients] = useState<(Client & { stats: ClientStats })[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Client | null>(null)
  const [deleting, setDeleting] = useState<Client | null>(null)
  const [expandedClient, setExpandedClient] = useState<string | null>(null)
  const [followUps, setFollowUps] = useState<Record<string, FollowUpWithClient[]>>({})
  const [loadingFu, setLoadingFu] = useState(false)
  const [whatsappTarget, setWhatsappTarget] = useState<Client | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getClients(search)
      setClients(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    fetch()
  }, [fetch])

  async function handleSave(data: ClientFormData) {
    try {
      if (editing) {
        await updateClient(editing.id, data)
      } else {
        await createClient(data)
      }
      toast.success('Client saved')
      setShowForm(false)
      setEditing(null)
      fetch()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  async function handleDelete() {
    if (!deleting) return
    try {
      await deleteClient(deleting.id)
      toast.success('Client deleted')
      setDeleting(null)
      fetch()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  async function toggleExpand(clientId: string) {
    if (expandedClient === clientId) {
      setExpandedClient(null)
      return
    }
    setExpandedClient(clientId)
    if (!followUps[clientId]) {
      setLoadingFu(true)
      try {
        const data = await getFollowUpsByClient(clientId)
        setFollowUps(prev => ({ ...prev, [clientId]: data }))
      } catch (err) {
        console.error(err)
      } finally {
        setLoadingFu(false)
      }
    }
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Clients</h1>
        <Button onClick={() => setShowForm(true)}>
          + Add Client
        </Button>
      </div>

      <Input
        type="text"
        placeholder="Search clients..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="mt-4 w-full"
      />

      {loading ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton />
        </div>
      ) : clients.length === 0 ? (
        <div className="mt-8">
          {search ? (
            <EmptyState title="No results" description="No clients match your search." />
          ) : (
            <EmptyState title="No clients yet" description="Click + Add Client to create your first client." />
          )}
        </div>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {clients.map(c => (
            <div key={c.id} className="hover:shadow-md transition-shadow">
              <ClientCard
                client={c}
                stats={c.stats}
                onEdit={() => { setEditing(c); setShowForm(true) }}
                onDelete={() => setDeleting(c)}
              />
              <div className="mt-1 flex gap-2">
                {(c.whatsapp || c.phone) && (
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => setWhatsappTarget(c)}
                  >
                    WhatsApp
                  </Button>
                )}
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => toggleExpand(c.id)}
                >
                  {expandedClient === c.id ? 'Hide follow-ups' : 'Show follow-ups'}
                </Button>
              </div>
              {expandedClient === c.id && (
                <div className="mt-2">
                  <Card>
                    <CardContent className="p-3">
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Follow-up History</h4>
                      {loadingFu ? (
                        <p className="text-xs text-muted-foreground">Loading...</p>
                      ) : followUps[c.id]?.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No follow-ups yet.</p>
                      ) : (
                        <div className="space-y-1.5">
                          {followUps[c.id]?.map(fu => (
                            <div key={fu.id} className="flex items-center justify-between rounded bg-card px-2.5 py-1.5 text-xs">
                              <div className="flex items-center gap-2">
                                <Badge variant={statusBadge[fu.status]}>
                                  {fu.status.replace('_', ' ')}
                                </Badge>
                                <span>Next: {formatDate(fu.next_follow_up_date)}</span>
                                <span>Last: {formatDate(fu.last_follow_up_date)}</span>
                              </div>
                              {fu.notes && <span className="truncate max-w-[120px] text-muted-foreground ml-2">{fu.notes}</span>}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <ClientForm
          client={editing}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditing(null) }}
        />
      )}

      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-sm">
            <CardHeader>
              <CardTitle>Delete Client</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Are you sure you want to delete <strong>{deleting.name}</strong>? This cannot be undone.
              </p>
              <div className="mt-5 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button>
                <Button variant="destructive" onClick={handleDelete}>Delete</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {whatsappTarget && (whatsappTarget.whatsapp || whatsappTarget.phone) && (
        <WhatsAppModal
          phone={whatsappTarget.whatsapp || whatsappTarget.phone!}
          clientName={whatsappTarget.name}
          onClose={() => setWhatsappTarget(null)}
        />
      )}
    </div>
    </AppLayout>
  )
}
