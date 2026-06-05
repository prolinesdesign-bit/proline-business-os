import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getTargetProgress, getTargets, createTarget, updateTarget, deleteTarget } from '../lib/api/targets'
import type { Target, TargetFormData, TargetProgress } from '../types'
import TargetForm from '../components/targets/TargetForm'

function formatCurrency(n: number) {
  return `₹${Math.round(n).toLocaleString()}`
}

export default function Targets() {
  const { signOut } = useAuth()
  const [targets, setTargets] = useState<Target[]>([])
  const [progress, setProgress] = useState<TargetProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Target | null>(null)
  const [deleting, setDeleting] = useState<Target | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const [t, p] = await Promise.all([getTargets(), getTargetProgress()])
      setTargets(t)
      setProgress(p)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  async function handleSave(data: TargetFormData) {
    if (editing) {
      await updateTarget(editing.id, data)
    } else {
      await createTarget(data)
    }
    setShowForm(false)
    setEditing(null)
    fetch()
  }

  async function handleDelete() {
    if (!deleting) return
    await deleteTarget(deleting.id)
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
          <Link to="/tasks" className="text-sm text-blue-600 hover:underline">Tasks</Link>
          <Link to="/calendar" className="text-sm text-blue-600 hover:underline">Calendar</Link>
          <Link to="/documents" className="text-sm text-blue-600 hover:underline">Documents</Link>
          <button onClick={signOut} className="rounded-lg border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50">Logout</button>
        </nav>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="flex items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold">Targets</h1>
          <button onClick={() => setShowForm(true)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            + New Target
          </button>
        </div>

        {loading ? (
          <p className="text-center text-gray-500 py-12">Loading...</p>
        ) : (
          <>
            {/* Current month target progress */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm mb-8">
              <h2 className="text-lg font-semibold mb-4">This Month's Target</h2>
              {progress && progress.target ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Target</p>
                      <p className="mt-1 text-2xl font-bold">{formatCurrency(progress.target.target_value)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Current Revenue</p>
                      <p className="mt-1 text-2xl font-bold text-green-600">{formatCurrency(progress.currentRevenue)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Remaining</p>
                      <p className={`mt-1 text-2xl font-bold ${progress.remaining > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                        {formatCurrency(progress.remaining)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Daily Needed</p>
                      <p className="mt-1 text-2xl font-bold text-orange-600">{formatCurrency(progress.dailyNeeded)}</p>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-medium">{progress.percentage}%</span>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          progress.percentage >= 100 ? 'bg-green-500' :
                          progress.percentage >= 75 ? 'bg-blue-500' :
                          progress.percentage >= 50 ? 'bg-amber-500' :
                          'bg-orange-500'
                        }`}
                        style={{ width: `${Math.min(100, progress.percentage)}%` }}
                      />
                    </div>
                  </div>

                  <div className="text-xs text-gray-500">
                    Target: {progress.target.title} &middot; {new Date(progress.target.start_date).toLocaleDateString()} — {new Date(progress.target.end_date).toLocaleDateString()}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-3">No target set for this month.</p>
                  <button onClick={() => setShowForm(true)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                    Set Monthly Target
                  </button>
                </div>
              )}
            </div>

            {/* All targets list */}
            <h2 className="text-lg font-semibold mb-4">All Targets</h2>
            {targets.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No targets created yet.</p>
            ) : (
              <div className="space-y-3">
                {targets.map(t => {
                  const pct = t.target_value > 0 ? Math.min(100, Math.round((t.current_value / t.target_value) * 100)) : 0
                  return (
                    <div key={t.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{t.title}</h3>
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              t.status === 'active' ? 'bg-green-100 text-green-700' :
                              t.status === 'achieved' ? 'bg-blue-100 text-blue-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {t.status}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {t.target_type} &middot; {new Date(t.start_date).toLocaleDateString()} — {new Date(t.end_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-medium">{formatCurrency(t.current_value)} / {formatCurrency(t.target_value)}</p>
                          <div className="mt-1 h-2 w-24 overflow-hidden rounded-full bg-gray-100 ml-auto">
                            <div className={`h-full rounded-full ${
                              t.status === 'achieved' ? 'bg-green-500' :
                              t.status === 'missed' ? 'bg-red-500' :
                              'bg-blue-500'
                            }`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button onClick={() => { setEditing(t); setShowForm(true) }} className="text-sm text-blue-600 hover:underline">Edit</button>
                          <button onClick={() => setDeleting(t)} className="text-sm text-red-600 hover:underline">Delete</button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>

      {showForm && (
        <TargetForm
          target={editing}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditing(null) }}
        />
      )}

      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold">Delete Target</h2>
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
