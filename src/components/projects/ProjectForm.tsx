import { useState, useEffect, useRef, type FormEvent } from 'react'
import { supabase } from '../../lib/supabase'
import { createProject } from '../../lib/api/projects'
import { createPayment } from '../../lib/api/payments'
import { createClient } from '../../lib/api/clients'
import type { Project, ProjectFormData, ClientFormData } from '../../types'
import ClientForm from '../clients/ClientForm'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Textarea } from '../ui/Textarea'
import { Label } from '../ui/Label'

interface ClientOption {
  id: string
  name: string
  phone: string | null
  last_project: string | null
}

const emptyForm: ProjectFormData = {
  name: '',
  description: '',
  status: 'lead',
  client_name: '',
  client_id: '',
  start_date: '',
  end_date: '',
  budget: '',
  project_type: '',
  location: '',
  location_url: '',
  expected_timeline: '',
  expected_payment_date: '',
  revision_count: '0',
}

const emptyClientForm: ClientFormData = {
  name: '',
  email: '',
  phone: '',
  company: '',
  address: '',
  source: '',
  notes: '',
}

interface Props {
  project?: Project | null
  prefillClientId?: string
  onSuccess?: (projectId: string) => void
  onSave?: (data: ProjectFormData) => Promise<void>
  onCancel: () => void
}

export default function ProjectForm({ project, prefillClientId, onSuccess, onSave, onCancel }: Props) {
  const [projectForm, setProjectForm] = useState<ProjectFormData>(() =>
    project
      ? {
          name: project.name,
          description: project.description ?? '',
          status: project.status,
          client_name: project.client_name ?? '',
          client_id: project.client_id ?? '',
          start_date: project.start_date ?? '',
          end_date: project.end_date ?? '',
          budget: project.budget?.toString() ?? '',
          project_type: project.project_type ?? '',
          location: project.location ?? '',
          location_url: project.location_url ?? '',
          expected_timeline: project.expected_timeline ?? '',
          expected_payment_date: project.expected_payment_date ?? '',
          revision_count: (project.revision_count ?? 0).toString(),
        }
      : { ...emptyForm, client_id: prefillClientId ?? '' },
  )
  const [clientMode, setClientMode] = useState<'select' | 'create'>(
    prefillClientId ? 'select' : 'select',
  )
  const [clientForm, setClientForm] = useState<ClientFormData>({ ...emptyClientForm })
  const [advanceReceived, setAdvanceReceived] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isEditing = !!project

  const [clientSearch, setClientSearch] = useState('')
  const [clientResults, setClientResults] = useState<ClientOption[]>([])
  const [selectedClient, setSelectedClient] = useState<ClientOption | null>(null)
  const [loadingClients, setLoadingClients] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  const [docFiles, setDocFiles] = useState<Record<string, File>>({})

  useEffect(() => {
    if (prefillClientId) fetchClientById(prefillClientId)
  }, [prefillClientId])

  async function fetchClientById(id: string) {
    const { data: clients } = await supabase
      .from('clients')
      .select('id, name, phone')
      .eq('id', id)
    if (!clients || clients.length === 0) return
    const c = clients[0]
    setSelectedClient({ id: c.id, name: c.name, phone: c.phone, last_project: null })
    setProjectForm(prev => ({ ...prev, client_name: c.name, client_id: c.id }))
  }

  useEffect(() => {
    if (clientMode !== 'select' || clientSearch.length < 1) {
      setClientResults([])
      return
    }
    const timer = setTimeout(async () => {
      setLoadingClients(true)
      const { data: clients } = await supabase
        .from('clients')
        .select('id, name, phone')
        .or(`name.ilike.%${clientSearch}%,phone.ilike.%${clientSearch}%`)
        .limit(10)
      if (clients) {
        const ids = clients.map(c => c.id)
        const { data: projects } = await supabase
          .from('projects')
          .select('client_id, name')
          .in('client_id', ids)
          .order('created_at', { ascending: false })
        const lastProjectMap: Record<string, string> = {}
        for (const p of projects ?? []) {
          if (p.client_id && !lastProjectMap[p.client_id]) {
            lastProjectMap[p.client_id] = p.name
          }
        }
        setClientResults(clients.map(c => ({
          id: c.id,
          name: c.name,
          phone: c.phone,
          last_project: lastProjectMap[c.id] ?? null,
        })))
      }
      setLoadingClients(false)
    }, 200)
    return () => clearTimeout(timer)
  }, [clientSearch, clientMode])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function selectClient(c: ClientOption) {
    setSelectedClient(c)
    setClientSearch(c.name)
    setProjectForm(prev => ({ ...prev, client_name: c.name, client_id: c.id }))
    setShowDropdown(false)
  }

  const advanceNum = Number(advanceReceived) || 0

  function setField<K extends keyof ProjectFormData>(key: K, value: ProjectFormData[K]) {
    setProjectForm(prev => ({ ...prev, [key]: value }))
  }

  async function uploadDoc(projectId: string, file: File, docType: string): Promise<void> {
    const path = `${projectId}/${docType}_${Date.now()}_${file.name}`
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(path, file)
    if (uploadError) throw uploadError

    const { error: dbError } = await supabase.from('documents').insert({
      project_id: projectId,
      name: file.name,
      file_type: file.type,
      file_size: file.size,
      storage_path: path,
      notes: docType,
    })
    if (dbError) throw dbError
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!projectForm.name.trim()) {
      setError('Project name is required')
      return
    }

    setSaving(true)
    setError(null)

    try {
      if (isEditing) {
        if (onSave) await onSave(projectForm)
        setSaving(false)
        return
      }

      if (clientMode === 'select' && !selectedClient) {
        setError('Please select a client or switch to create new client')
        setSaving(false)
        return
      }
      if (clientMode === 'create' && !clientForm.name.trim()) {
        setError('Client name is required')
        setSaving(false)
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      let finalClientId = projectForm.client_id
      let finalClientName = projectForm.client_name

      if (clientMode === 'create') {
        const newClient = await createClient(clientForm)
        finalClientId = newClient.id
        finalClientName = newClient.name
      }

      const newProject = await createProject({
        ...projectForm,
        client_id: finalClientId,
        client_name: finalClientName,
      })

      if (advanceNum > 0) {
        createPayment({
          project_id: newProject.id,
          amount: String(advanceNum),
          payment_date: new Date().toISOString().slice(0, 10),
          description: 'Advance payment',
          method: 'bank_transfer',
          status: 'completed',
        }).catch(err => console.error('Failed to create advance payment:', err))
      }

      Object.entries(docFiles).forEach(([docType, file]) => {
        uploadDoc(newProject.id, file, docType).catch(err => {
          console.error(`Failed to upload ${docType}:`, err)
        })
      })

      onSuccess!(newProject.id)
    } catch (err) {
      const msg = (err as any)?.message || (err as any)?.error?.message || 'Failed to create project'
      console.error('Project creation error:', err)
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  const sectionClass = 'space-y-3 rounded-lg border border-border p-4'
  const sectionTitleClass = 'text-sm font-semibold text-foreground mb-3'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-card shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-6 py-4">
          <h2 className="text-lg font-bold">New Project</h2>
          <button onClick={onCancel} className="text-muted-foreground hover:text-foreground text-xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6 pt-4 space-y-5">

          {/* Project Name */}
          <div>
            <Label htmlFor="name">Project Name *</Label>
            <Input id="name" required value={projectForm.name} onChange={e => setField('name', e.target.value)} className="mt-1" autoFocus />
          </div>

          {/* Client */}
          <div className={sectionClass}>
            <h3 className={sectionTitleClass}>Client</h3>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setClientMode('select'); setError(null) }}
                className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                  clientMode === 'select'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:bg-accent'
                }`}
              >
                Select Existing Client
              </button>
              <button
                type="button"
                onClick={() => { setClientMode('create'); setError(null); setClientForm({ ...emptyClientForm }) }}
                className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                  clientMode === 'create'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:bg-accent'
                }`}
              >
                Create New Client
              </button>
            </div>

            {clientMode === 'select' ? (
              <div ref={searchRef} className="relative">
                <Label>Search Client</Label>
                <Input
                  value={clientSearch}
                  onChange={e => { setClientSearch(e.target.value); setShowDropdown(true) }}
                  onFocus={() => setShowDropdown(true)}
                  placeholder="Search by name, phone..."
                  className="mt-1"
                />
                {loadingClients && <p className="mt-1 text-xs text-muted-foreground">Searching...</p>}
                {showDropdown && clientResults.length > 0 && (
                  <div className="absolute z-20 mt-1 w-full rounded-lg border border-border bg-card shadow-lg max-h-60 overflow-y-auto">
                    {clientResults.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => selectClient(c)}
                        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-accent transition-colors border-b border-border last:border-0"
                      >
                        <div>
                          <p className="font-medium">{c.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {c.phone ? c.phone : 'No phone'}
                            {c.last_project ? `  ·  Last: ${c.last_project}` : ''}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0 ml-2">Select →</span>
                      </button>
                    ))}
                  </div>
                )}
                {selectedClient && (
                  <div className="mt-2 rounded-lg border border-border bg-accent/30 px-4 py-2.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{selectedClient.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {selectedClient.phone}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setSelectedClient(null); setClientSearch(''); setProjectForm(prev => ({ ...prev, client_name: '', client_id: '' })) }}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        Change
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <ClientForm mode="inline" value={clientForm} onChange={setClientForm} />
            )}
          </div>

          {/* Amount */}
          <div>
            <Label htmlFor="budget">Amount (₹)</Label>
            <Input id="budget" type="number" min="0" step="0.01" value={projectForm.budget} onChange={e => setField('budget', e.target.value)} className="mt-1" />
          </div>

          {/* Advance Paid */}
          <div>
            <Label htmlFor="advance">Advance Paid (₹)</Label>
            <Input id="advance" type="number" min="0" step="0.01" value={advanceReceived} onChange={e => setAdvanceReceived(e.target.value)} className="mt-1" />
          </div>

          {/* Location */}
          <div className={sectionClass}>
            <h3 className={sectionTitleClass}>Location</h3>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input id="location" value={projectForm.location} onChange={e => setField('location', e.target.value)} className="mt-1" placeholder="e.g. Mumbai, Andheri West" />
            </div>
            <div>
              <Label htmlFor="location_url">Google Maps Link</Label>
              <Input id="location_url" value={projectForm.location_url} onChange={e => setField('location_url', e.target.value)} className="mt-1" placeholder="https://maps.app.goo.gl/..." />
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="description">Notes</Label>
            <Textarea id="description" rows={3} value={projectForm.description} onChange={e => setField('description', e.target.value)} className="mt-1" />
          </div>

          {/* Documents */}
          <div className={sectionClass}>
            <h3 className={sectionTitleClass}>Documents (Optional)</h3>
            <div className="grid grid-cols-2 gap-3">
              {['Photos', 'PDFs'].map(docType => (
                <label
                  key={docType}
                  className="flex cursor-pointer flex-col items-center gap-1 rounded-lg border border-dashed border-border p-4 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                >
                  <span className="text-lg">{docType === 'Photos' ? '📸' : '📄'}</span>
                  <span className="font-medium">{docType}</span>
                  {docFiles[docType] && <span className="text-[10px] text-green-600 truncate max-w-full">{docFiles[docType].name}</span>}
                  <input
                    type="file"
                    className="hidden"
                    accept={docType === 'Photos' ? 'image/*' : '.pdf,.doc,.docx'}
                    onChange={e => {
                      const file = e.target.files?.[0]
                      if (file) setDocFiles(prev => ({ ...prev, [docType]: file }))
                    }}
                  />
                </label>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : isEditing ? 'Update Project' : 'Create Project'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}