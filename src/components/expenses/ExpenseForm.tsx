import { useState, type FormEvent } from 'react'
import type { Expense, ExpenseFormData, Project } from '../../types'
import { EXPENSE_CATEGORIES } from '../../types'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Textarea } from '../ui/Textarea'
import { Select } from '../ui/Select'
import { Label } from '../ui/Label'

const emptyForm: ExpenseFormData = {
  project_id: '',
  amount: '',
  expense_date: new Date().toISOString().slice(0, 10),
  category: '',
  description: '',
}

interface Props {
  expense?: Expense | null
  projects: Pick<Project, 'id' | 'name'>[]
  onSave: (data: ExpenseFormData) => Promise<void>
  onCancel: () => void
}

export default function ExpenseForm({ expense, projects, onSave, onCancel }: Props) {
  const [form, setForm] = useState<ExpenseFormData>(() =>
    expense
      ? {
          project_id: expense.project_id ?? '',
          amount: expense.amount.toString(),
          expense_date: expense.expense_date?.slice(0, 10) ?? '',
          category: expense.category,
          description: expense.description ?? '',
        }
      : { ...emptyForm },
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
      setError(err instanceof Error ? err.message : 'Failed to save expense')
    } finally {
      setSaving(false)
    }
  }

  function set<K extends keyof ExpenseFormData>(key: K, value: ExpenseFormData[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl"
      >
        <h2 className="mb-4 text-lg font-bold">{expense ? 'Edit Expense' : 'New Expense'}</h2>

        <div className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label className="block">Category</Label>
              <Select
                required
                value={form.category}
                onChange={e => set('category', e.target.value)}
                className="mt-1"
              >
                <option value="">Select category</option>
                {EXPENSE_CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label className="block">Amount (₹)</Label>
              <Input
                required
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={e => set('amount', e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label className="block">Date</Label>
              <Input
                required
                type="date"
                value={form.expense_date}
                onChange={e => set('expense_date', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="block">Linked Project</Label>
              <Select
                value={form.project_id}
                onChange={e => set('project_id', e.target.value)}
                className="mt-1"
              >
                <option value="">None</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </Select>
            </div>
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

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={saving}
          >
            {saving ? 'Saving...' : expense ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </div>
  )
}
