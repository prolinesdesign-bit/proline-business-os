import { useEffect, useState, useCallback } from 'react'
import type { Client, ClientFormData, ClientStats } from '../types'
import { getClients, createClient, updateClient, deleteClient } from '../lib/api/clients'
import ClientCard from '../components/clients/ClientCard'
import ClientForm from '../components/clients/ClientForm'

export default function Clients() {
  const [clients, setClients] = useState<(Client & { stats: ClientStats })[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Client | null>(null)
  const [deleting, setDeleting] = useState<Client | null>(null)

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
            <ClientCard
              key={c.id}
              client={c}
              stats={c.stats}
              onEdit={() => { setEditing(c); setShowForm(true) }}
              onDelete={() => setDeleting(c)}
            />
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
    </div>
  )
}
