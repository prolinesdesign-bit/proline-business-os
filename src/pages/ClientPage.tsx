import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getClients } from '../lib/api/clients'
import { getProjects } from '../lib/api/projects'
import { getProjectSummaries } from '../lib/api/payments'
import type { Client, Project, ProjectPaymentSummary } from '../types'
import AppLayout from '../components/layout/AppLayout'
import { Button } from '../components/ui/Button'
import { Card, CardContent } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Skeleton } from '../components/ui/Skeleton'

export default function ClientPage() {
  const { id } = useParams<{ id: string }>()
  const [client, setClient] = useState<Client | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [summaries, setSummaries] = useState<ProjectPaymentSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    Promise.all([
      getClients(''),
      getProjects(''),
      getProjectSummaries(),
    ])
      .then(([clients, projs, sums]) => {
        const c = clients.find(x => x.id === id)
        setClient(c ?? null)
        setProjects(projs.filter(p => p.client_id === id))
        setSummaries(sums)
      })
      .catch(err => console.error('Failed to load client:', err))
      .finally(() => setLoading(false))
  }, [id])

  const totalValue = projects.reduce((sum, p) => sum + (p.budget ?? 0), 0)
  const totalPaid = projects.reduce((sum, p) => {
    const s = summaries.find(x => x.project_id === p.id)
    return sum + (s?.total_paid ?? 0)
  }, 0)
  const balanceDue = totalValue - totalPaid

  if (loading) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-5xl px-4 py-6">
          <Skeleton className="h-8 w-64 mb-4" />
          <div className="grid gap-4 sm:grid-cols-3">
            <Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" />
          </div>
        </div>
      </AppLayout>
    )
  }

  if (!client) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-5xl px-4 py-6">
          <p className="text-center text-muted-foreground py-12">Client not found.</p>
          <div className="text-center">
            <Link to="/clients" className="text-sm text-blue-600 hover:underline">← Back to Clients</Link>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-5xl px-4 py-6">
        <Link to="/clients" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to Clients
        </Link>

        <div className="mt-2 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{client.name}</h1>
            {client.company && <p className="text-muted-foreground">{client.company}</p>}
          </div>
          <div className="flex gap-2">
            {(client.whatsapp || client.phone) && (
              <Button
                variant="success"
                size="sm"
                asChild
              >
                <a
                  href={`https://wa.me/${(client.whatsapp ?? client.phone ?? '').replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  WhatsApp
                </a>
              </Button>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
          {client.phone && <span>📞 {client.phone}</span>}
          {client.email && <span>✉️ {client.email}</span>}
          {client.whatsapp && <span>💬 {client.whatsapp}</span>}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-medium uppercase text-muted-foreground">Total Revenue</p>
              <p className="mt-1 text-xl font-bold">₹{totalValue.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-medium uppercase text-muted-foreground">Outstanding</p>
              <p className="mt-1 text-xl font-bold">₹{balanceDue.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-medium uppercase text-muted-foreground">Projects</p>
              <p className="mt-1 text-xl font-bold">{projects.length}</p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-semibold">Projects</h2>
          {projects.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No projects for this client yet.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {projects.map(p => {
                const s = summaries.find(x => x.project_id === p.id)
                const badgeVariant: Record<string, 'success' | 'default' | 'warning' | 'destructive'> = {
                  active: 'success', completed: 'default', on_hold: 'warning', cancelled: 'destructive',
                }
                return (
                  <Card key={p.id}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <Link to={`/project/${p.id}`} className="text-sm font-medium text-blue-600 hover:underline">
                            {p.name}
                          </Link>
                          <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                            <span>₹{p.budget?.toLocaleString() ?? '-'}</span>
                            {p.end_date && <span>Due: {p.end_date}</span>}
                            <span>Paid: ₹{(s?.total_paid ?? 0).toLocaleString()}</span>
                          </div>
                        </div>
                        <Badge variant={badgeVariant[p.status] ?? 'default'}>
                          {p.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
