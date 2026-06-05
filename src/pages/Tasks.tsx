import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getTasks, createTask, updateTask, updateTaskStatus, deleteTask } from '../lib/api/tasks'
import type { Task, TaskFormData, TaskWithProject } from '../types'
import TaskForm from '../components/tasks/TaskForm'

const statusColors: Record<Task['status'], string> = {
  todo: 'bg-gray-100 text-gray-700',
  in_progress: 'bg-blue-100 text-blue-700',
  done: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

const priorityColors: Record<Task['priority'], string> = {
  low: 'border-gray-300 text-gray-600',
  medium: 'border-yellow-300 text-yellow-700',
  high: 'border-orange-300 text-orange-700',
  urgent: 'border-red-300 text-red-700',
}

export default function Tasks() {
  const { signOut } = useAuth()
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
    if (editing) {
      await updateTask(editing.id, data)
    } else {
      await createTask(data)
    }
    setShowForm(false)
    setEditing(null)
    fetch()
  }

  async function handleStatusChange(task: TaskWithProject, newStatus: Task['status']) {
    await updateTaskStatus(task.id, newStatus)
    fetch()
  }

  async function handleDelete() {
    if (!deleting) return
    await deleteTask(deleting.id)
    setDeleting(null)
    fetch()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
        <Link to="/" className="text-xl font-bold">Proline V1</Link>
        <nav className="flex items-center gap-4">
          <Link to="/projects" className="text-sm text-blue-600 hover:underline">Projects</Link>
          <Link to="/clients" className="text-sm text-blue-600 hover:underline">Clients</Link>
          <Link to="/payments" className="text-sm text-blue-600 hover:underline">Payments</Link>
          <Link to="/expenses" className="text-sm text-blue-600 hover:underline">Expenses</Link>
          <Link to="/targets" className="text-sm text-blue-600 hover:underline">Targets</Link>
          <Link to="/calendar" className="text-sm text-blue-600 hover:underline">Calendar</Link>
          <Link to="/documents" className="text-sm text-blue-600 hover:underline">Documents</Link>
          <Link to="/followups" className="text-sm text-blue-600 hover:underline">Follow-ups</Link>
          <button onClick={signOut} className="rounded-lg border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50">Logout</button>
        </nav>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="flex items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold">Tasks</h1>
          <button onClick={() => setShowForm(true)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            + New Task
          </button>
        </div>

        <div className="mb-4 flex items-center gap-2">
          <label className="text-sm font-medium text-gray-600">Filter by project:</label>
          <input
            type="text"
            placeholder="Project ID..."
            value={filterProject}
            onChange={e => setFilterProject(e.target.value)}
            className="w-64 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
          />
          {filterProject && (
            <button onClick={() => setFilterProject('')} className="text-sm text-gray-500 hover:text-gray-700">Clear</button>
          )}
        </div>

        {loading ? (
          <p className="text-center text-gray-500 py-12">Loading...</p>
        ) : tasks.length === 0 ? (
          <p className="text-center text-gray-500 py-12">No tasks found. Create one to get started.</p>
        ) : (
          <div className="space-y-2">
            {tasks.map(t => (
              <div key={t.id} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
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
                    <span className={`rounded border px-1.5 py-0.5 text-xs font-medium ${priorityColors[t.priority]}`}>
                      {t.priority}
                    </span>
                    <span className={`line-through ${t.status === 'done' ? '' : 'hidden'} mr-1`} />
                    <span className={`font-medium ${t.status === 'done' ? 'text-gray-400 line-through' : ''}`}>
                      {t.title}
                    </span>
                  </div>
                  <div className="mt-0.5 flex gap-3 text-xs text-gray-500">
                    {t.project_name && <span>Project: {t.project_name}</span>}
                    {t.due_date && <span>Due: {t.due_date}</span>}
                  </div>
                </div>

                <div className="flex gap-2 shrink-0">
                  <button onClick={() => { setEditing(t); setShowForm(true) }} className="text-sm text-blue-600 hover:underline">Edit</button>
                  <button onClick={() => setDeleting(t)} className="text-sm text-red-600 hover:underline">Delete</button>
                </div>
              </div>
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
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold">Delete Task</h2>
            <p className="mt-2 text-sm text-gray-600">
              Delete <strong>{deleting.title}</strong>? This cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setDeleting(null)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={handleDelete} className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
