import { useEffect, useState, useCallback } from 'react'
import type { Client, ClientFormData, ClientStats, FollowUpWithClient } from '../types'
import { getClients, createClient, updateClient, deleteClient } from '../lib/api/clients'
import { getFollowUpsByClient } from '../lib/api/followups'
import ClientCard from '../components/clients/ClientCard'
import ClientForm from '../components/clients/ClientForm'
import WhatsAppModal from '../components/WhatsAppModal'

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  contacted: 'bg-blue-100 text-blue-800',
  waiting_client: 'bg-purple-100 text-purple-800',
  closed: 'bg-green-100 text-green-800',
}

function formatDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function Clients() {
  const [clients, setClients] = useState<(Client & { stats: ClientStats })[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Client | null>(null)
  const [deleting, setDeleting] = useState<Client | null>(null)
  const [expandedClient, setExpandedClient] = useState<string | null>(null)
  const [followUps, setFollowUps] = useState<Record<string, FollowUpWithClient[]>>({})
  const [loadingFu, setLoadingFu] = useState(false)
  const [whatsappTarget, setWhatsappTarget] = useState<Client | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getClients(search)
      setClients(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    fetch()
  }, [fetch])

  async function handleSave(data: ClientFormData) {
    if (editing) {
      await updateClient(editing.id, data)
    } else {
      await createClient(data)
    }
    setShowForm(false)
    setEditing(null)
    fetch()
  }

  async function handleDelete() {
    if (!deleting) return
    await deleteClient(deleting.id)
    setDeleting(null)
    fetch()
  }

  async function toggleExpand(clientId: string) {
    if (expandedClient === clientId) {
      setExpandedClient(null)
      return
    }
    setExpandedClient(clientId)
    if (!followUps[clientId]) {
      setLoadingFu(true)
      try {
        const data = await getFollowUpsByClient(clientId)
        setFollowUps(prev => ({ ...prev, [clientId]: data }))
      } catch (err) {
        console.error(err)
      } finally {
        setLoadingFu(false)
      }
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Clients</h1>
        <button
          onClick={() => setShowForm(true)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Add Client
        </button>
      </div>

      <input
        type="text"
        placeholder="Search clients..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="mt-4 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
      />

      {loading ? (
        <p className="mt-8 text-center text-gray-500">Loading...</p>
      ) : clients.length === 0 ? (
        <p className="mt-8 text-center text-gray-500">
          {search ? 'No clients match your search.' : 'No clients yet. Click + Add Client to get started.'}
        </p>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {clients.map(c => (
            <div key={c.id}>
              <ClientCard
                client={c}
                stats={c.stats}
                onEdit={() => { setEditing(c); setShowForm(true) }}
                onDelete={() => setDeleting(c)}
              />
              <div className="mt-1 flex gap-2">
                {(c.whatsapp || c.phone) && (
                  <button
                    onClick={() => setWhatsappTarget(c)}
                    className="rounded-lg bg-green-500 px-3 py-1 text-xs font-medium text-white hover:bg-green-600"
                  >
                    WhatsApp
                  </button>
                )}
                <button
                  onClick={() => toggleExpand(c.id)}
                  className="text-xs text-blue-600 hover:underline"
                >
                  {expandedClient === c.id ? 'Hide follow-ups' : 'Show follow-ups'}
                </button>
              </div>
              {expandedClient === c.id && (
                <div className="mt-2 rounded-lg border border-gray-100 bg-gray-50 p-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Follow-up History</h4>
                  {loadingFu ? (
                    <p className="text-xs text-gray-400">Loading...</p>
                  ) : followUps[c.id]?.length === 0 ? (
                    <p className="text-xs text-gray-400">No follow-ups yet.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {followUps[c.id]?.map(fu => (
                        <div key={fu.id} className="flex items-center justify-between rounded bg-white px-2.5 py-1.5 text-xs">
                          <div className="flex items-center gap-2">
                            <span className={`rounded-full px-1.5 py-0.5 text-xs font-medium ${statusColors[fu.status]}`}>
                              {fu.status.replace('_', ' ')}
                            </span>
                            <span>Next: {formatDate(fu.next_follow_up_date)}</span>
                            <span>Last: {formatDate(fu.last_follow_up_date)}</span>
                          </div>
                          {fu.notes && <span className="truncate max-w-[120px] text-gray-500 ml-2">{fu.notes}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <ClientForm
          client={editing}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditing(null) }}
        />
      )}

      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold">Delete Client</h2>
            <p className="mt-2 text-sm text-gray-600">
              Are you sure you want to delete <strong>{deleting.name}</strong>? This cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setDeleting(null)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleDelete} className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {whatsappTarget && (whatsappTarget.whatsapp || whatsappTarget.phone) && (
        <WhatsAppModal
          phone={whatsappTarget.whatsapp || whatsappTarget.phone!}
          clientName={whatsappTarget.name}
          onClose={() => setWhatsappTarget(null)}
        />
      )}
    </div>
  )
}
