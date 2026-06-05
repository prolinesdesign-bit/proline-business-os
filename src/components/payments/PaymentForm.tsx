import { useState, type FormEvent } from 'react'
import type { Payment, PaymentFormData, Project } from '../../types'

interface Props {
  projects: Pick<Project, 'id' | 'name'>[]
  payment?: Payment | null
  onSave: (data: PaymentFormData) => Promise<void>
  onCancel: () => void
}

export default function PaymentForm({ projects, payment, onSave, onCancel }: Props) {
  const [form, setForm] = useState<PaymentFormData>(() =>
    payment
      ? {
          project_id: payment.project_id ?? '',
          amount: payment.amount.toString(),
          payment_date: payment.payment_date,
          description: payment.description ?? '',
        }
      : {
          project_id: '',
          amount: '',
          payment_date: new Date().toISOString().slice(0, 10),
          description: '',
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
      setError(err instanceof Error ? err.message : 'Failed to save payment')
    } finally {
      setSaving(false)
    }
  }

  function set<K extends keyof PaymentFormData>(key: K, value: PaymentFormData[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-bold">{payment ? 'Edit Payment' : 'New Payment'}</h2>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Project</label>
            <select
              required
              value={form.project_id}
              onChange={e => set('project_id', e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="">Select a project...</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Amount ($)</label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={form.amount}
              onChange={e => set('amount', e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Payment Date</label>
            <input
              type="date"
              required
              value={form.payment_date}
              onChange={e => set('payment_date', e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
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
          <button type="button" onClick={onCancel} className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50">
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : payment ? 'Update' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  )
}
