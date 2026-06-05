import { useEffect, useState, useCallback } from 'react'
import type { Project, ProjectFormData, SiteVisit } from '../types'
import { getProjects, createProject, updateProject, deleteProject } from '../lib/api/projects'
import { getDocumentCounts } from '../lib/api/documents'
import { supabase } from '../lib/supabase'
import ProjectCard from '../components/projects/ProjectCard'
import ProjectForm from '../components/projects/ProjectForm'
import WhatsAppModal from '../components/WhatsAppModal'
import AppLayout from '../components/layout/AppLayout'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { toast } from 'sonner'
import { CardSkeleton } from '../components/ui/Skeleton'
import { EmptyState } from '../components/ui/EmptyState'

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [docCounts, setDocCounts] = useState<Record<string, number>>({})
  const [svPhotoCounts, setSvPhotoCounts] = useState<Record<string, number>>({})
  const [clientWhatsapp, setClientWhatsapp] = useState<Record<string, string>>({})
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Project | null>(null)
  const [deleting, setDeleting] = useState<Project | null>(null)
  const [whatsappTarget, setWhatsappTarget] = useState<{ phone: string; name: string } | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const [data, counts, svRes] = await Promise.all([
        getProjects(search),
        getDocumentCounts(),
        supabase.from('site_visits').select('project_id, photo_urls'),
      ])
      setProjects(data)
      setDocCounts(counts)

      const photoCounts: Record<string, number> = {}
      for (const sv of (svRes.data ?? []) as SiteVisit[]) {
        if (sv.project_id) {
          const urls = sv.photo_urls as unknown as string[]
          photoCounts[sv.project_id] = (photoCounts[sv.project_id] ?? 0) + (urls?.length ?? 0)
        }
      }
      setSvPhotoCounts(photoCounts)

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
  }, [search])

  useEffect(() => {
    fetch()
  }, [fetch])

  async function handleSave(data: ProjectFormData) {
    try {
      if (editing) {
        await updateProject(editing.id, data)
      } else {
        await createProject(data)
      }
      toast.success('Project saved')
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
      await deleteProject(deleting.id)
      toast.success('Project deleted')
      setDeleting(null)
      fetch()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Projects</h1>
        <Button onClick={() => setShowForm(true)}>
          + Add Project
        </Button>
      </div>

      <Input
        type="text"
        placeholder="Search projects..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="mt-4 w-full"
      />

      {loading ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton />
        </div>
      ) : projects.length === 0 ? (
        <div className="mt-8">
          {search ? (
            <EmptyState title="No results" description="No projects match your search." />
          ) : (
            <EmptyState title="No projects yet" description="Click + Add Project to create your first project." />
          )}
        </div>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {projects.map(p => {
            const wp = p.client_id ? clientWhatsapp[p.client_id] : undefined
            return (
              <div key={p.id} className="hover:shadow-md transition-shadow">
                <ProjectCard
                  project={p}
                  docCount={docCounts[p.id] ?? 0}
                  siteVisitPhotoCount={svPhotoCounts[p.id] ?? 0}
                  onEdit={() => { setEditing(p); setShowForm(true) }}
                  onDelete={() => setDeleting(p)}
                />
                {wp && (
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => setWhatsappTarget({ phone: wp, name: p.client_name ?? p.name })}
                    className="mt-1"
                  >
                    WhatsApp {p.client_name}
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {showForm && (
        <ProjectForm
          project={editing}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditing(null) }}
        />
      )}

      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-sm">
            <CardHeader>
              <CardTitle>Delete Project</CardTitle>
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

      {whatsappTarget && (
        <WhatsAppModal
          phone={whatsappTarget.phone}
          clientName={whatsappTarget.name}
          onClose={() => setWhatsappTarget(null)}
        />
      )}
    </div>
    </AppLayout>
  )
}
