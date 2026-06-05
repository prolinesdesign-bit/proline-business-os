import { useEffect, useState, useCallback } from 'react'
import { getTargetProgress, getTargets, createTarget, updateTarget, deleteTarget } from '../lib/api/targets'
import type { Target, TargetFormData, TargetProgress } from '../types'
import TargetForm from '../components/targets/TargetForm'
import AppLayout from '../components/layout/AppLayout'
import { Button } from '../components/ui/Button'
import { Card, CardContent } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { toast } from 'sonner'
import { CardSkeleton } from '../components/ui/Skeleton'
import { EmptyState } from '../components/ui/EmptyState'

function formatCurrency(n: number) {
  return `₹${Math.round(n).toLocaleString()}`
}

export default function Targets() {
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
    try {
      if (editing) {
        await updateTarget(editing.id, data)
      } else {
        await createTarget(data)
      }
      toast.success('Target saved')
      setShowForm(false)
      setEditing(null)
      fetch()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save target')
    }
  }

  async function handleDelete() {
    if (!deleting) return
    try {
      await deleteTarget(deleting.id)
      toast.success('Target deleted')
      setDeleting(null)
      fetch()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete target')
    }
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="flex items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold">Targets</h1>
          <Button onClick={() => setShowForm(true)}>
            + New Target
          </Button>
        </div>

        {loading ? (
          <div className="space-y-4"><CardSkeleton /><CardSkeleton /></div>
        ) : (
          <>
            {/* Current month target progress */}
            <Card className="mb-8">
              <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4">This Month's Target</h2>
              {progress && progress.target ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Target</p>
                      <p className="mt-1 text-2xl font-bold">{formatCurrency(progress.target.target_value)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Current Revenue</p>
                      <p className="mt-1 text-2xl font-bold text-green-600">{formatCurrency(progress.currentRevenue)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Remaining</p>
                      <p className={`mt-1 text-2xl font-bold ${progress.remaining > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                        {formatCurrency(progress.remaining)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Daily Needed</p>
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

                  <div className="text-xs text-muted-foreground">
                    Target: {progress.target.title} &middot; {new Date(progress.target.start_date).toLocaleDateString()} — {new Date(progress.target.end_date).toLocaleDateString()}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-3">No target set for this month.</p>
                  <Button onClick={() => setShowForm(true)}>
                    Set Monthly Target
                  </Button>
                </div>
              )}
              </CardContent>
            </Card>

            {/* All targets list */}
            <h2 className="text-lg font-semibold mb-4">All Targets</h2>
            {targets.length === 0 ? (
              <EmptyState title="No targets yet" description="Create your first target to start tracking progress." />
            ) : (
              <div className="space-y-3">
                {targets.map(t => {
                  const pct = t.target_value > 0 ? Math.min(100, Math.round((t.current_value / t.target_value) * 100)) : 0
                  return (
                    <Card key={t.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{t.title}</h3>
                            <Badge variant={
                              t.status === 'active' ? 'success' :
                              t.status === 'achieved' ? 'default' :
                              'destructive'
                            }>
                              {t.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
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
                          <Button variant="link" size="sm" onClick={() => { setEditing(t); setShowForm(true) }}>Edit</Button>
                          <Button variant="link" size="sm" className="text-destructive" onClick={() => setDeleting(t)}>Delete</Button>
                        </div>
                      </div>
                      </CardContent>
                    </Card>
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
              <Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDelete}>Delete</Button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
