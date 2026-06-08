import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import type { Client, ClientFormData, ClientStats, FollowUpWithClient } from '../types'
import { getClients, createClient, updateClient, deleteClient } from '../lib/api/clients'
import { getFollowUpsByClient } from '../lib/api/followups'
import ClientForm from '../components/clients/ClientForm'
import AppLayout from '../components/layout/AppLayout'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table'
import { toast } from 'sonner'
import { TableSkeleton } from '../components/ui/Skeleton'
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

function generateWhatsAppLink(phone: string): string {
  let cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 10) cleaned = '91' + cleaned
  return `https://wa.me/${cleaned}`
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
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save client')
    }
  }

  async function handleDelete() {
    if (!deleting) return
    try {
      await deleteClient(deleting.id)
      toast.success('Client deleted')
      setDeleting(null)
      fetch()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete client')
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
      <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-3xl tracking-tight">Clients</h1>
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
        <div className="mt-4">
          <TableSkeleton rows={6} />
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
        <div className="mt-4 rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Projects</TableHead>
                <TableHead>Total Value</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map(c => (
                <>
                  <TableRow key={c.id} className="group">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Link to={`/client/${c.id}`} className="hover:underline truncate max-w-[180px]">
                          {c.name}
                        </Link>
                        <Link
                          to={`/client/${c.id}`}
                          className="shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Open client"
                        >
                          ↗
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell>
                      {c.phone ? (
                        <a
                          href={generateWhatsAppLink(c.phone)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {c.phone}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{c.email || '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{c.company || '—'}</TableCell>
                    <TableCell>
                      {c.source ? (
                        <Badge variant="outline">{c.source}</Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>{c.stats.project_count}</TableCell>
                    <TableCell className="font-medium">
                      ₹{(c.stats.total_value || 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => toggleExpand(c.id)}
                        >
                          {expandedClient === c.id ? 'Hide FU' : 'FU'}
                        </Button>
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => { setEditing(c); setShowForm(true) }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="link"
                          size="sm"
                          className="text-destructive"
                          onClick={() => setDeleting(c)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  {expandedClient === c.id && (
                    <TableRow key={`${c.id}-fu`}>
                      <TableCell colSpan={8} className="bg-muted/30 p-0">
                        <div className="px-4 py-3">
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
                                  {fu.notes && <span className="truncate max-w-[200px] text-muted-foreground ml-2">{fu.notes}</span>}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))}
            </TableBody>
          </Table>
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
    </div>
    </AppLayout>
  )
}


