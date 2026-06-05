import { useState, type FormEvent } from 'react'
import type { Target, TargetFormData } from '../../types'

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
      <form onSubmit={handleSubmit} className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-bold">{target ? 'Edit Target' : 'New Target'}</h2>

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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Target Amount (₹)</label>
              <input
                required
                type="number"
                min="0"
                step="0.01"
                value={form.target_value}
                onChange={e => set('target_value', e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Start Date</label>
              <input
                required
                type="date"
                value={form.start_date}
                onChange={e => set('start_date', e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">End Date</label>
              <input
                required
                type="date"
                value={form.end_date}
                onChange={e => set('end_date', e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Saving...' : target ? 'Update' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  )
}
