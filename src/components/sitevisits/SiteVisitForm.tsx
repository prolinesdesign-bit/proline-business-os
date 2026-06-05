import { useState, useEffect, type FormEvent } from 'react'
import type { SiteVisit, SiteVisitFormData, SiteVisitStatus, Project, Client } from '../../types'
import { getProjects } from '../../lib/api/projects'
import { getClients } from '../../lib/api/clients'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Textarea } from '../ui/Textarea'
import { Select } from '../ui/Select'
import { Label } from '../ui/Label'

interface Props {
  siteVisit?: SiteVisit | null
  onSave: (data: SiteVisitFormData) => Promise<void>
  onCancel: () => void
}

const STATUSES: { value: SiteVisitStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

export default function SiteVisitForm({ siteVisit, onSave, onCancel }: Props) {
  const [projects, setProjects] = useState<Project[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [form, setForm] = useState<SiteVisitFormData>(() =>
    siteVisit
      ? {
          project_id: siteVisit.project_id ?? '',
          client_id: siteVisit.client_id ?? '',
          visit_date: siteVisit.visit_date?.slice(0, 10) ?? '',
          location: siteVisit.location ?? '',
          notes: siteVisit.notes ?? '',
          travel_cost: siteVisit.travel_cost?.toString() ?? '',
          site_status: siteVisit.site_status,
          next_action: siteVisit.next_action ?? '',
          latitude: siteVisit.latitude?.toString() ?? '',
          longitude: siteVisit.longitude?.toString() ?? '',
        }
      : {
          project_id: '',
          client_id: '',
          visit_date: '',
          location: '',
          notes: '',
          travel_cost: '',
          site_status: 'pending',
          next_action: '',
          latitude: '',
          longitude: '',
        },
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [locating, setLocating] = useState(false)

  useEffect(() => {
    Promise.all([getProjects(''), getClients('')]).then(([p, c]) => {
      setProjects(p)
      setClients(c)
    }).catch(console.error)
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await onSave(form)
    } catch (err) {
      const msg = err && typeof err === 'object' && 'message' in err ? String((err as { message: unknown }).message) : String(err)
      setError(msg || 'Failed to save site visit')
      console.error('Site visit save error:', err)
    } finally {
      setSaving(false)
    }
  }

  function set<K extends keyof SiteVisitFormData>(key: K, value: SiteVisitFormData[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function captureLocation() {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.')
      return
    }
    setLocating(true)
    setError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        set('latitude', pos.coords.latitude.toString())
        set('longitude', pos.coords.longitude.toString())
        setLocating(false)
      },
      (err) => {
        setError(`Location error: ${err.message}`)
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-bold">{siteVisit ? 'Edit Site Visit' : 'New Site Visit'}</h2>

        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="block">Visit Date</Label>
              <Input
                required
                type="date"
                value={form.visit_date}
                onChange={e => set('visit_date', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="block">Status</Label>
              <Select
                value={form.site_status}
                onChange={e => set('site_status', e.target.value as SiteVisitStatus)}
                className="mt-1"
              >
                {STATUSES.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </Select>
            </div>
          </div>

          <div>
            <Label className="block">Location</Label>
            <Input
              value={form.location}
              onChange={e => set('location', e.target.value)}
              placeholder="e.g. 123 Main Street"
              className="mt-1"
            />
          </div>

          {/* Coordinates */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label className="block">Coordinates</Label>
              <Button
                type="button"
                variant="link"
                size="sm"
                onClick={captureLocation}
                disabled={locating}
              >
                {locating ? 'Capturing...' : 'Get Current Location'}
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input
                value={form.latitude}
                onChange={e => set('latitude', e.target.value)}
                placeholder="Latitude"
              />
              <Input
                value={form.longitude}
                onChange={e => set('longitude', e.target.value)}
                placeholder="Longitude"
              />
            </div>
            {form.latitude && form.longitude && (
              <a
                href={`https://www.google.com/maps?q=${form.latitude},${form.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block text-xs text-blue-600 hover:underline"
              >
                Open in Google Maps
              </a>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="block">Project</Label>
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
            <div>
              <Label className="block">Client</Label>
              <Select
                value={form.client_id}
                onChange={e => set('client_id', e.target.value)}
                className="mt-1"
              >
                <option value="">None</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </div>
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

          <div>
            <Label className="block">Next Action</Label>
            <Input
              value={form.next_action}
              onChange={e => set('next_action', e.target.value)}
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="block">Travel Cost (₹)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.travel_cost}
                onChange={e => set('travel_cost', e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : siteVisit ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </div>
  )
}
