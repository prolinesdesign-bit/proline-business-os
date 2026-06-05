import { useEffect, useState, useCallback } from 'react'
import type { Project, ProjectFormData } from '../types'
import { getProjects, createProject, updateProject, deleteProject } from '../lib/api/projects'
import { getDocumentCounts } from '../lib/api/documents'
import { supabase } from '../lib/supabase'
import ProjectCard from '../components/projects/ProjectCard'
import ProjectForm from '../components/projects/ProjectForm'
import WhatsAppModal from '../components/WhatsAppModal'

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [docCounts, setDocCounts] = useState<Record<string, number>>({})
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
      const [data, counts] = await Promise.all([getProjects(search), getDocumentCounts()])
      setProjects(data)
      setDocCounts(counts)

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
    if (editing) {
      await updateProject(editing.id, data)
    } else {
      await createProject(data)
    }
    setShowForm(false)
    setEditing(null)
    fetch()
  }

  async function handleDelete() {
    if (!deleting) return
    await deleteProject(deleting.id)
    setDeleting(null)
    fetch()
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Projects</h1>
        <button
          onClick={() => setShowForm(true)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Add Project
        </button>
      </div>

      <input
        type="text"
        placeholder="Search projects..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="mt-4 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
      />

      {loading ? (
        <p className="mt-8 text-center text-gray-500">Loading...</p>
      ) : projects.length === 0 ? (
        <p className="mt-8 text-center text-gray-500">
          {search ? 'No projects match your search.' : 'No projects yet. Click + Add Project to get started.'}
        </p>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {projects.map(p => {
            const wp = p.client_id ? clientWhatsapp[p.client_id] : undefined
            return (
              <div key={p.id}>
                <ProjectCard
                  project={p}
                  docCount={docCounts[p.id] ?? 0}
                  onEdit={() => { setEditing(p); setShowForm(true) }}
                  onDelete={() => setDeleting(p)}
                />
                {wp && (
                  <button
                    onClick={() => setWhatsappTarget({ phone: wp, name: p.client_name ?? p.name })}
                    className="mt-1 rounded-lg bg-green-500 px-3 py-1 text-xs font-medium text-white hover:bg-green-600"
                  >
                    WhatsApp {p.client_name}
                  </button>
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
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold">Delete Project</h2>
            <p className="mt-2 text-sm text-gray-600">
              Are you sure you want to delete <strong>{deleting.name}</strong>? This cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setDeleting(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
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
  )
}
