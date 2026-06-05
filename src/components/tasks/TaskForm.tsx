import { useState, useEffect, type FormEvent } from 'react'
import type { Task, TaskFormData, Project } from '../../types'
import { getProjects } from '../../lib/api/projects'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Textarea } from '../ui/Textarea'
import { Select } from '../ui/Select'
import { Label } from '../ui/Label'

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
            <Label className="block">Title</Label>
            <Input
              required
              value={form.title}
              onChange={e => set('title', e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="block">Description</Label>
            <Textarea
              rows={3}
              value={form.description}
              onChange={e => set('description', e.target.value)}
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="block">Priority</Label>
              <Select
                value={form.priority}
                onChange={e => set('priority', e.target.value as Task['priority'])}
                className="mt-1"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </Select>
            </div>
            <div>
              <Label className="block">Due Date</Label>
              <Input
                type="date"
                value={form.due_date}
                onChange={e => set('due_date', e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label className="block">Project</Label>
            <Select
              value={form.project_id}
              onChange={e => set('project_id', e.target.value)}
              className="mt-1"
            >
              <option value="">No project</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Select>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : task ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </div>
  )
}
