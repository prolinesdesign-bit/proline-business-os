import { useState, type FormEvent } from 'react'
import type { Project, ProjectFormData } from '../../types'

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
      console.group('Project creation failed')
      console.error('Full error object:', err)
      if (err && typeof err === 'object') {
        console.error('Error code:', (err as Record<string, unknown>).code)
        console.error('Error message:', (err as Record<string, unknown>).message)
        console.error('Error details:', (err as Record<string, unknown>).details)
        console.error('Error hint:', (err as Record<string, unknown>).hint)
      }
      console.groupEnd()
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
        className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl"
      >
        <h2 className="mb-4 text-lg font-bold">{project ? 'Edit Project' : 'New Project'}</h2>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Project Name</label>
            <input
              required
              value={form.name}
              onChange={e => set('name', e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Stage</label>
              <select
                value={form.status}
                onChange={e => set('status', e.target.value as Project['status'])}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              >
                {STAGES.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Project Value ($)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.budget}
                onChange={e => set('budget', e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Client Name</label>
              <input
                value={form.client_name}
                onChange={e => set('client_name', e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Due Date</label>
              <input
                type="date"
                value={form.end_date}
                onChange={e => set('end_date', e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Start Date</label>
              <input
                type="date"
                value={form.start_date}
                onChange={e => set('start_date', e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={e => set('description', e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : project ? 'Update' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  )
}
