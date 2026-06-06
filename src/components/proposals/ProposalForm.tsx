import { useState, useEffect, type FormEvent } from 'react'
import type { Proposal, ProposalFormData, ProposalTemplate, Client, ClientFormData, Project } from '../../types'
import { TEMPLATE_LABELS } from '../../types'
import { getClients, createClient } from '../../lib/api/clients'
import { getProjects } from '../../lib/api/projects'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Textarea } from '../ui/Textarea'
import { Select } from '../ui/Select'
import { Label } from '../ui/Label'

interface Props {
  proposal?: Proposal | null
  selectedClient?: Client | null
  selectedProject?: Project | null
  onSave: (data: ProposalFormData) => Promise<void>
  onCancel: () => void
}

const TEMPLATES = (Object.keys(TEMPLATE_LABELS) as ProposalTemplate[]).map(t => ({
  value: t,
  label: TEMPLATE_LABELS[t],
}))

export default function ProposalForm({ proposal, selectedClient, selectedProject, onSave, onCancel }: Props) {
  const [clients, setClients] = useState<Client[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [showNewClient, setShowNewClient] = useState(false)
  const [newClientForm, setNewClientForm] = useState<ClientFormData>({ name: '', email: '', phone: '', whatsapp: '', location: '', notes: '' })
  const [savingClient, setSavingClient] = useState(false)
  const [form, setForm] = useState<ProposalFormData>(() =>
    proposal
      ? {
          client_id: proposal.client_id,
          project_id: proposal.project_id ?? '',
          template: proposal.template,
          fee_amount: proposal.fee_amount?.toString() ?? '',
          scope_of_work: proposal.scope_of_work,
          deliverables: proposal.deliverables,
          timeline: proposal.timeline,
          terms_conditions: proposal.terms_conditions,
        }
      : {
          client_id: selectedClient?.id ?? '',
          project_id: selectedProject?.id ?? '',
          template: 'architecture',
          fee_amount: '',
          scope_of_work: '',
          deliverables: '',
          timeline: '',
          terms_conditions: '',
        },
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([getClients(''), getProjects('')]).then(([c, p]) => {
      setClients(c)
      setProjects(p)
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
      setError(msg || 'Failed to save proposal')
      console.error('Proposal save error:', err)
    } finally {
      setSaving(false)
    }
  }

  function set<K extends keyof ProposalFormData>(key: K, value: ProposalFormData[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-2xl rounded-xl bg-card p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-bold">
          {proposal ? `Edit ${TEMPLATE_LABELS[proposal.template]}` : 'New Proposal'}
        </h2>

        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {/* Template */}
          <div>
            <Label className="block">Template</Label>
            <Select
              value={form.template}
              onChange={e => set('template', e.target.value as ProposalTemplate)}
            >
              {TEMPLATES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </Select>
          </div>

          {/* Client / Project */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between">
                <Label className="block">Client *</Label>
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  onClick={() => setShowNewClient(true)}
                >
                  + New
                </Button>
              </div>
              <Select
                required
                value={form.client_id}
                onChange={e => set('client_id', e.target.value)}
              >
                <option value="">Select client</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label className="block">Project</Label>
              <Select
                value={form.project_id}
                onChange={e => set('project_id', e.target.value)}
              >
                <option value="">Select project (optional)</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </Select>
            </div>
          </div>

          {/* Inline New Client Form */}
          {showNewClient && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
              <h4 className="mb-2 text-sm font-semibold text-blue-800">New Client</h4>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  required
                  value={newClientForm.name}
                  onChange={e => setNewClientForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Client name *"
                  className="col-span-2"
                />
                <Input
                  value={newClientForm.phone}
                  onChange={e => setNewClientForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Phone"
                />
                <Input
                  value={newClientForm.email}
                  onChange={e => setNewClientForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Email"
                  type="email"
                />
              </div>
              <div className="mt-2 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => { setShowNewClient(false); setNewClientForm({ name: '', email: '', phone: '', whatsapp: '', location: '', notes: '' }) }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={async () => {
                    if (!newClientForm.name.trim()) return
                    setSavingClient(true)
                    try {
                      const client = await createClient(newClientForm)
                      const updated = await getClients('')
                      setClients(updated)
                      setForm(prev => ({ ...prev, client_id: client.id }))
                      setShowNewClient(false)
                      setNewClientForm({ name: '', email: '', phone: '', whatsapp: '', location: '', notes: '' })
                    } catch (err) {
                      console.error('Failed to create client:', err)
                    } finally {
                      setSavingClient(false)
                    }
                  }}
                  disabled={savingClient || !newClientForm.name.trim()}
                >
                  {savingClient ? 'Saving...' : 'Add'}
                </Button>
              </div>
            </div>
          )}

          {/* Fee */}
          <div>
            <Label className="block">Fee Amount (₹) *</Label>
            <Input
              required
              type="number"
              min="0"
              step="0.01"
              value={form.fee_amount}
              onChange={e => set('fee_amount', e.target.value)}
              placeholder="e.g. 50000"
            />
          </div>

          {/* Scope of Work */}
          <div>
            <Label className="block">Scope of Work *</Label>
            <Textarea
              required
              rows={4}
              value={form.scope_of_work}
              onChange={e => set('scope_of_work', e.target.value)}
              placeholder="Describe the scope of work in detail..."
            />
          </div>

          {/* Deliverables */}
          <div>
            <Label className="block">Deliverables *</Label>
            <Textarea
              required
              rows={3}
              value={form.deliverables}
              onChange={e => set('deliverables', e.target.value)}
              placeholder="List the deliverables..."
            />
          </div>

          {/* Timeline */}
          <div>
            <Label className="block">Timeline *</Label>
            <Textarea
              required
              rows={2}
              value={form.timeline}
              onChange={e => set('timeline', e.target.value)}
              placeholder="e.g. 4 weeks from date of acceptance"
            />
          </div>

          {/* Terms */}
          <div>
            <Label className="block">Terms & Conditions *</Label>
            <Textarea
              required
              rows={4}
              value={form.terms_conditions}
              onChange={e => set('terms_conditions', e.target.value)}
              placeholder="Payment terms, cancellation policy, etc."
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button type="submit" variant="default" disabled={saving}>
            {saving ? 'Saving...' : proposal ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </div>
  )
}
