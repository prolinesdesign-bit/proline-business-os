import { useState, useEffect, type FormEvent } from 'react'
import type { FollowUp, FollowUpFormData, FollowUpStatus, Client } from '../../types'
import { getClients } from '../../lib/api/clients'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Textarea } from '../ui/Textarea'
import { Select } from '../ui/Select'
import { Label } from '../ui/Label'

interface Props {
  followUp?: FollowUp | null
  onSave: (data: FollowUpFormData) => Promise<void>
  onCancel: () => void
}

const STATUSES: { value: FollowUpStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'waiting_client', label: 'Waiting Client' },
  { value: 'closed', label: 'Closed' },
]

export default function FollowUpForm({ followUp, onSave, onCancel }: Props) {
  const [clients, setClients] = useState<Client[]>([])
  const [form, setForm] = useState<FollowUpFormData>(() =>
    followUp
      ? {
          client_id: followUp.client_id,
          next_follow_up_date: followUp.next_follow_up_date?.slice(0, 10) ?? '',
          last_follow_up_date: followUp.last_follow_up_date?.slice(0, 10) ?? '',
          notes: followUp.notes ?? '',
          status: followUp.status,
        }
      : {
          client_id: '',
          next_follow_up_date: '',
          last_follow_up_date: '',
          notes: '',
          status: 'pending',
        },
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getClients('').then(setClients).catch(console.error)
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    if (!form.client_id) {
      setError('Please select a client')
      setSaving(false)
      return
    }
    try {
      await onSave(form)
    } catch (err) {
      const msg = err && typeof err === 'object' && 'message' in err ? String((err as { message: unknown }).message) : String(err)
      setError(msg || 'Failed to save follow-up')
      console.error('Follow-up save error:', err)
    } finally {
      setSaving(false)
    }
  }

  function set<K extends keyof FollowUpFormData>(key: K, value: FollowUpFormData[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-lg rounded-xl bg-card p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-bold">{followUp ? 'Edit Follow-up' : 'New Follow-up'}</h2>

        <div className="space-y-3">
          <div>
            <Label className="block">Client</Label>
            <Select
              required
              value={form.client_id}
              onChange={e => set('client_id', e.target.value)}
              className="mt-1"
            >
              <option value="">Select a client</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="block">Next Follow-up</Label>
              <Input
                type="date"
                value={form.next_follow_up_date}
                onChange={e => set('next_follow_up_date', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="block">Last Follow-up</Label>
              <Input
                type="date"
                value={form.last_follow_up_date}
                onChange={e => set('last_follow_up_date', e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label className="block">Status</Label>
            <Select
              value={form.status}
              onChange={e => set('status', e.target.value as FollowUpStatus)}
              className="mt-1"
            >
              {STATUSES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </Select>
          </div>

          <div>
            <Label className="block">Notes</Label>
            <Textarea
              rows={3}
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              className="mt-1"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : followUp ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </div>
  )
}
