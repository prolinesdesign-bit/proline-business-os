import { useState, useEffect, type FormEvent } from 'react'
import type { Task, TaskFormData, Project } from '../../types'
import { getProjects } from '../../lib/api/projects'

interface Props {
  task?: Task | null
  onSave: (data: TaskFormData) => Promise<void>
  onCancel: () => void
}

export default function TaskForm({ task, onSave, onCancel }: Props) {
  const [projects, setProjects] = useState<Project[]>([])
  const [form, setForm] = useState<TaskFormData>(() =>
    task
      ? {
          title: task.title,
          description: task.description ?? '',
          priority: task.priority,
          due_date: task.due_date?.slice(0, 10) ?? '',
          project_id: task.project_id ?? '',
        }
      : {
          title: '',
          description: '',
          priority: 'medium',
          due_date: '',
          project_id: '',
        },
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getProjects('').then(setProjects).catch(console.error)
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await onSave(form)
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Failed to save task')
    } finally {
      setSaving(false)
    }
  }

  function set<K extends keyof TaskFormData>(key: K, value: TaskFormData[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-bold">{task ? 'Edit Task' : 'New Task'}</h2>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input
              required
              value={form.title}
              onChange={e => set('title', e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={e => set('description', e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Priority</label>
              <select
                value={form.priority}
                onChange={e => set('priority', e.target.value as Task['priority'])}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Due Date</label>
              <input
                type="date"
                value={form.due_date}
                onChange={e => set('due_date', e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Project</label>
            <select
              value={form.project_id}
              onChange={e => set('project_id', e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="">No project</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Saving...' : task ? 'Update' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  )
}
