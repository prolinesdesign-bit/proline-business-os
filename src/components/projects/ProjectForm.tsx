import { useState, type FormEvent } from 'react'
import type { Project, ProjectFormData } from '../../types'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Textarea } from '../ui/Textarea'
import { Select } from '../ui/Select'
import { Label } from '../ui/Label'

const STAGES = [
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'cancelled', label: 'Cancelled' },
] as const

const emptyForm: ProjectFormData = {
  name: '',
  description: '',
  status: 'active',
  client_name: '',
  start_date: '',
  end_date: '',
  budget: '',
}

interface Props {
  project?: Project | null
  onSave: (data: ProjectFormData) => Promise<void>
  onCancel: () => void
}

export default function ProjectForm({ project, onSave, onCancel }: Props) {
  const [form, setForm] = useState<ProjectFormData>(() =>
    project
      ? {
          name: project.name,
          description: project.description ?? '',
          status: project.status,
          client_name: project.client_name ?? '',
          start_date: project.start_date ?? '',
          end_date: project.end_date ?? '',
          budget: project.budget?.toString() ?? '',
        }
      : { ...emptyForm },
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await onSave(form)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save project')
    } finally {
      setSaving(false)
    }
  }

  function set<K extends keyof ProjectFormData>(key: K, value: ProjectFormData[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg rounded-xl bg-card p-6 shadow-xl"
      >
        <h2 className="mb-4 text-lg font-bold">{project ? 'Edit Project' : 'New Project'}</h2>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="name">Project Name</Label>
            <Input
              id="name"
              required
              value={form.name}
              onChange={e => set('name', e.target.value)}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="status">Stage</Label>
              <Select
                id="status"
                value={form.status}
                onChange={e => set('status', e.target.value as Project['status'])}
              >
                {STAGES.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="budget">Project Value (₹)</Label>
              <Input
                id="budget"
                type="number"
                min="0"
                step="0.01"
                value={form.budget}
                onChange={e => set('budget', e.target.value)}
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="client_name">Client Name</Label>
              <Input
                id="client_name"
                value={form.client_name}
                onChange={e => set('client_name', e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="end_date">Due Date</Label>
              <Input
                id="end_date"
                type="date"
                value={form.end_date}
                onChange={e => set('end_date', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="start_date">Start Date</Label>
            <Input
              id="start_date"
              type="date"
              value={form.start_date}
              onChange={e => set('start_date', e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="description">Notes</Label>
            <Textarea
              id="description"
              rows={3}
              value={form.description}
              onChange={e => set('description', e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : project ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </div>
  )
}
