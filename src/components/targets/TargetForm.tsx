import { useState, type FormEvent } from 'react'
import type { Target, TargetFormData } from '../../types'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Label } from '../ui/Label'

interface Props {
  target?: Target | null
  onSave: (data: TargetFormData) => Promise<void>
  onCancel: () => void
}

export default function TargetForm({ target, onSave, onCancel }: Props) {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)

  const [form, setForm] = useState<TargetFormData>(() =>
    target
      ? {
          title: target.title,
          target_value: target.target_value.toString(),
          start_date: target.start_date?.slice(0, 10) ?? monthStart,
          end_date: target.end_date?.slice(0, 10) ?? monthEnd,
        }
      : {
          title: `Monthly Revenue Target — ${now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
          target_value: '',
          start_date: monthStart,
          end_date: monthEnd,
        },
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
      console.error(err)
      setError(err instanceof Error ? err.message : 'Failed to save target')
    } finally {
      setSaving(false)
    }
  }

  function set<K extends keyof TargetFormData>(key: K, value: TargetFormData[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-lg rounded-xl bg-card p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-bold">{target ? 'Edit Target' : 'New Target'}</h2>

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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="block">Target Amount (₹)</Label>
              <Input
                required
                type="number"
                min="0"
                step="0.01"
                value={form.target_value}
                onChange={e => set('target_value', e.target.value)}
                className="mt-1"
              />
            </div>
            <div />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="block">Start Date</Label>
              <Input
                required
                type="date"
                value={form.start_date}
                onChange={e => set('start_date', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="block">End Date</Label>
              <Input
                required
                type="date"
                value={form.end_date}
                onChange={e => set('end_date', e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : target ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </div>
  )
}
