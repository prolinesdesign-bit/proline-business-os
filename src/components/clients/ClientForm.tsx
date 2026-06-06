import { useState, type FormEvent } from 'react'
import type { Client, ClientFormData } from '../../types'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Textarea } from '../ui/Textarea'
import { Label } from '../ui/Label'

const emptyForm: ClientFormData = {
  name: '',
  email: '',
  phone: '',
  location: '',
  whatsapp: '',
  notes: '',
}

interface Props {
  client?: Client | null
  onSave: (data: ClientFormData) => Promise<void>
  onCancel: () => void
}

export default function ClientForm({ client, onSave, onCancel }: Props) {
  const [form, setForm] = useState<ClientFormData>(() =>
    client
      ? {
          name: client.name,
          email: client.email ?? '',
          phone: client.phone ?? '',
          location: client.company ?? '',
          whatsapp: client.whatsapp ?? '',
          notes: client.notes ?? '',
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
      setError(err instanceof Error ? err.message : 'Failed to save client')
    } finally {
      setSaving(false)
    }
  }

  function set<K extends keyof ClientFormData>(key: K, value: ClientFormData[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-lg rounded-xl bg-card p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-bold">{client ? 'Edit Client' : 'New Client'}</h2>

        <div className="space-y-3">
          <div>
            <Label className="block">Name</Label>
            <Input
              required
              value={form.name}
              onChange={e => set('name', e.target.value)}
              className="mt-1"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label className="block">Phone</Label>
              <Input
                type="tel"
                value={form.phone}
                onChange={e => set('phone', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="block">WhatsApp</Label>
              <Input
                type="tel"
                value={form.whatsapp}
                onChange={e => set('whatsapp', e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label className="block">Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="block">Location</Label>
              <Input
                value={form.location}
                onChange={e => set('location', e.target.value)}
                className="mt-1"
              />
            </div>
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
