import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getClients } from '../lib/api/clients'
import { getProjects } from '../lib/api/projects'
import { getProjectSummaries } from '../lib/api/payments'
import type { Client, Project, ProjectPaymentSummary } from '../types'
import AppLayout from '../components/layout/AppLayout'
import ProjectForm from '../components/projects/ProjectForm'
import { Button } from '../components/ui/Button'
import { Card, CardContent } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Skeleton } from '../components/ui/Skeleton'
import { toast } from 'sonner'

const badgeVariant: Record<string, 'success' | 'default' | 'warning' | 'destructive' | 'secondary'> = {
  lead: 'warning',
  communicated: 'default',
  advance_paid: 'success',
  prelim_model: 'default',
  discussed: 'default',
  final_render: 'default',
  balance_paid: 'success',
  delivered: 'default',
  cancelled: 'destructive',
}

export default function ClientPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [client, setClient] = useState<Client | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [summaries, setSummaries] = useState<ProjectPaymentSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewProject, setShowNewProject] = useState(false)

  useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    Promise.all([
      getClients(''),
      getProjects(''),
      getProjectSummaries(),
    ])
      .then(([clients, projs, sums]) => {
        if (!cancelled) {
          const c = clients.find(x => x.id === id)
          setClient(c ?? null)
          setProjects(projs.filter(p => p.client_id === id))
          setSummaries(sums)
        }
      })
      .catch(err => console.error('Failed to load client:', err))
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [id])

  const totalValue = projects.reduce((sum, p) => sum + (p.budget ?? 0), 0)
  const totalPaid = projects.reduce((sum, p) => {
    const s = summaries.find(x => x.project_id === p.id)
    return sum + (s?.total_paid ?? 0)
  }, 0)
  const balanceDue = totalValue - totalPaid
  const activeProjects = projects.filter(p =>
    !['completed', 'delivered', 'cancelled'].includes(p.status)
  ).length

  function handleProjectCreated(projectId: string) {
    toast.success('Project created')
    setShowNewProject(false)
    navigate(`/project/${projectId}`)
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-5xl px-4 py-6">
          <Skeleton className="h-8 w-64 mb-4" />
          <div className="grid gap-4 sm:grid-cols-4">
            <Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" />
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
            <Link to="/clients" className="text-sm text-primary hover:underline">← Back to Clients</Link>
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
            <h1 className="font-display text-3xl tracking-tight">{client.name}</h1>
            {client.company && <p className="text-muted-foreground">{client.company}</p>}
            {client.address && <p className="text-xs text-muted-foreground mt-0.5">{client.address}</p>}
          </div>
          <div className="flex gap-2">
            {client.phone && (
              <Button variant="success" size="sm" asChild>
                <a
                  href={`https://wa.me/${client.phone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  WhatsApp
                </a>
              </Button>
            )}
            <Button size="sm" onClick={() => setShowNewProject(true)}>
              + New Project
            </Button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
          {client.phone && <span>📞 {client.phone}</span>}
          {client.email && <span>✉️ {client.email}</span>}
          {client.source && (
            <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium">
              Source: {client.source}
            </span>
          )}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-medium uppercase text-muted-foreground">Total Projects</p>
              <p className="mt-1 text-xl font-bold">{projects.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-medium uppercase text-muted-foreground">Active Projects</p>
              <p className="mt-1 text-xl font-bold">{activeProjects}</p>
            </CardContent>
          </Card>
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
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Projects ({projects.length})</h2>
            <Button size="sm" variant="outline" onClick={() => setShowNewProject(true)}>
              + New Project
            </Button>
          </div>
          {projects.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-muted-foreground">No projects for this client yet.</p>
              <Button className="mt-3" size="sm" onClick={() => setShowNewProject(true)}>
                Create First Project
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {projects.map(p => {
                const s = summaries.find(x => x.project_id === p.id)
                return (
                  <Card key={p.id}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <Link to={`/project/${p.id}`} className="text-sm font-medium text-primary hover:underline">
                            {p.name}
                          </Link>
                          <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                            <span>₹{p.budget?.toLocaleString() ?? '-'}</span>
                            {p.project_type && <span>{p.project_type}</span>}
                            {p.end_date && <span>Due: {p.end_date}</span>}
                            <span>Paid: ₹{(s?.total_paid ?? 0).toLocaleString()}</span>
                            {p.location && <span>📍 {p.location}</span>}
                          </div>
                        </div>
                        <Badge variant={badgeVariant[p.status] ?? 'secondary'}>
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

        {client.notes && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-muted-foreground mb-1">Notes</h3>
            <p className="text-sm whitespace-pre-wrap">{client.notes}</p>
          </div>
        )}
      </div>

      {showNewProject && (
        <ProjectForm
          prefillClientId={client.id}
          onSuccess={handleProjectCreated}
          onCancel={() => setShowNewProject(false)}
        />
      )}
    </AppLayout>
  )
}