import { useState, type FormEvent } from 'react'
import type { Payment, PaymentFormData, Project } from '../../types'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Textarea } from '../ui/Textarea'
import { Select } from '../ui/Select'
import { Label } from '../ui/Label'

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
            <Label className="block">Project</Label>
            <Select
              required
              value={form.project_id}
              onChange={e => set('project_id', e.target.value)}
              className="mt-1"
            >
              <option value="">Select a project...</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Select>
          </div>

          <div>
            <Label className="block">Amount (₹)</Label>
            <Input
              type="number"
              required
              min="0"
              step="0.01"
              value={form.amount}
              onChange={e => set('amount', e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="block">Payment Date</Label>
            <Input
              type="date"
              required
              value={form.payment_date}
              onChange={e => set('payment_date', e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="block">Notes</Label>
            <Textarea
              rows={3}
              value={form.description}
              onChange={e => set('description', e.target.value)}
              className="mt-1"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : payment ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </div>
  )
}
