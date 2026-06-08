import { useEffect, useState, useCallback } from 'react'
import { getTasks, createTask, updateTask, updateTaskStatus, deleteTask } from '../lib/api/tasks'
import type { Task, TaskFormData, TaskWithProject } from '../types'
import TaskForm from '../components/tasks/TaskForm'
import AppLayout from '../components/layout/AppLayout'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'
import { toast } from 'sonner'
import { CardSkeleton } from '../components/ui/Skeleton'
import { EmptyState } from '../components/ui/EmptyState'

const statusColors: Record<Task['status'], string> = {
  todo: 'bg-muted text-muted-foreground',
  in_progress: 'bg-primary-light text-primary',
  done: 'bg-success-light text-success',
  cancelled: 'bg-destructive-light text-destructive',
}

const priorityColors: Record<Task['priority'], string> = {
  low: 'border-border text-muted-foreground',
  medium: 'border-chart-4/50 text-chart-4',
  high: 'border-chart-1/50 text-chart-1',
  urgent: 'border-destructive/50 text-destructive',
}

export default function Tasks() {
  const [tasks, setTasks] = useState<TaskWithProject[]>([])
  const [filterProject, setFilterProject] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Task | null>(null)
  const [deleting, setDeleting] = useState<TaskWithProject | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getTasks(filterProject || undefined)
      setTasks(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [filterProject])

  useEffect(() => { fetch() }, [fetch])

  async function handleSave(data: TaskFormData) {
    try {
      if (editing) {
        await updateTask(editing.id, data)
      } else {
        await createTask(data)
      }
      toast.success('Task saved')
      setShowForm(false)
      setEditing(null)
      fetch()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save task')
    }
  }

  async function handleStatusChange(task: TaskWithProject, newStatus: Task['status']) {
    try {
      await updateTaskStatus(task.id, newStatus)
      toast.success('Task status updated')
      fetch()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update task status')
    }
  }

  async function handleDelete() {
    if (!deleting) return
    try {
      await deleteTask(deleting.id)
      toast.success('Task deleted')
      setDeleting(null)
      fetch()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete task')
    }
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="flex items-center justify-between gap-4 mb-6">
          <h1 className="font-display text-3xl tracking-tight">Tasks</h1>
          <Button onClick={() => setShowForm(true)}>
            + New Task
          </Button>
        </div>

        <div className="mb-4 flex items-center gap-2">
          <label className="text-sm font-medium text-muted-foreground">Filter by project:</label>
          <Input
            type="text"
            placeholder="Project ID..."
            value={filterProject}
            onChange={e => setFilterProject(e.target.value)}
            className="w-64"
          />
          {filterProject && (
            <Button variant="link" size="sm" onClick={() => setFilterProject('')}>Clear</Button>
          )}
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton />
          </div>
        ) : tasks.length === 0 ? (
          <EmptyState title="No tasks yet" description="Create one to get started." />
        ) : (
          <div className="space-y-2">
            {tasks.map(t => (
              <Card key={t.id}>
                <CardContent className="flex items-center gap-3 p-4">
                  <select
                    value={t.status}
                    onChange={e => handleStatusChange(t, e.target.value as Task['status'])}
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[t.status]} border-0 cursor-pointer`}
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="done">Done</option>
                    <option value="cancelled">Cancelled</option>
                  </select>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-md border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${priorityColors[t.priority]}`}>
                        {t.priority}
                      </span>
                      <span className={`font-medium ${t.status === 'done' ? 'text-muted-foreground line-through' : ''}`}>
                        {t.title}
                      </span>
                    </div>
                    <div className="mt-0.5 flex gap-3 text-xs text-muted-foreground">
                      {t.project_name && <span>Project: {t.project_name}</span>}
                      {t.due_date && <span>Due: {t.due_date}</span>}
                    </div>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <Button variant="link" size="sm" onClick={() => { setEditing(t); setShowForm(true) }}>Edit</Button>
                    <Button variant="link" size="sm" className="text-destructive" onClick={() => setDeleting(t)}>Delete</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <TaskForm
          task={editing}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditing(null) }}
        />
      )}

      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-sm">
            <CardHeader>
              <CardTitle>Delete Task</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Delete <strong>{deleting.title}</strong>? This cannot be undone.
              </p>
              <div className="mt-5 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button>
                <Button variant="destructive" onClick={handleDelete}>Delete</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </AppLayout>
  )
}
