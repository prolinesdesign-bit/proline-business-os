import { useState, type FormEvent } from 'react'
import type { Client, ClientFormData } from '../../types'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Textarea } from '../ui/Textarea'
import { Select } from '../ui/Select'
import { Label } from '../ui/Label'

export const SOURCE_OPTIONS = [
  { value: '', label: 'Select source...' },
  { value: 'Referral', label: 'Referral' },
  { value: 'Instagram', label: 'Instagram' },
  { value: 'Website', label: 'Website' },
  { value: 'Walk-in', label: 'Walk-in' },
  { value: 'Other', label: 'Other' },
] as const

const emptyForm: ClientFormData = {
  name: '',
  email: '',
  phone: '',
  company: '',
  address: '',
  source: '',
  notes: '',
}

interface Props {
  client?: Client | null
  onSave?: (data: ClientFormData) => Promise<void>
  onCancel?: () => void
  mode?: 'modal' | 'inline'
  value?: ClientFormData
  onChange?: (data: ClientFormData) => void
}

export default function ClientForm({ client, onSave, onCancel, mode = 'modal', value, onChange }: Props) {
  const isControlled = mode === 'inline' && value !== undefined && onChange !== undefined
  const [internalForm, setInternalForm] = useState<ClientFormData>(() =>
    client
      ? {
          name: client.name,
          email: client.email ?? '',
          phone: client.phone ?? '',
          company: client.company ?? '',
          address: client.address ?? '',
          source: client.source ?? '',
          notes: client.notes ?? '',
        }
      : { ...emptyForm },
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = isControlled ? value : internalForm

  function set<K extends keyof ClientFormData>(key: K, val: ClientFormData[K]) {
    if (isControlled) {
      onChange({ ...value!, [key]: val })
    } else {
      setInternalForm(prev => ({ ...prev, [key]: val }))
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!onSave) return
    setSaving(true)
    setError(null)
    try {
      await onSave(form)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save client')
    } finally {
      setSaving(false)
    }
  }

  const fields = (
    <div className="space-y-3">
      <div>
        <Label className="block">Name *</Label>
        <Input
          required
          value={form.name}
          onChange={e => set('name', e.target.value)}
          className="mt-1"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <Label className="block">WhatsApp / Phone *</Label>
          <Input
            required
            type="tel"
            value={form.phone}
            onChange={e => set('phone', e.target.value)}
            className="mt-1"
            placeholder="Phone = WhatsApp"
          />
        </div>
        <div>
          <Label className="block">Email</Label>
          <Input
            type="email"
            value={form.email}
            onChange={e => set('email', e.target.value)}
            className="mt-1"
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <Label className="block">Company Name</Label>
          <Input
            value={form.company}
            onChange={e => set('company', e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <Label className="block">Source</Label>
          <Select
            value={form.source}
            onChange={e => set('source', e.target.value)}
            className="mt-1"
          >
            {SOURCE_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
        </div>
      </div>

      <div>
        <Label className="block">Address</Label>
        <Textarea
          rows={2}
          value={form.address}
          onChange={e => set('address', e.target.value)}
          className="mt-1"
        />
      </div>

      <div>
        <Label className="block">Notes</Label>
        <Textarea
          rows={2}
          value={form.notes}
          onChange={e => set('notes', e.target.value)}
          className="mt-1"
        />
      </div>
    </div>
  )

  if (mode === 'inline') {
    return <div className="space-y-3">{fields}</div>
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-lg rounded-xl bg-card p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-bold">{client ? 'Edit Client' : 'New Client'}</h2>

        {fields}

        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : client ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </div>
  )
}
