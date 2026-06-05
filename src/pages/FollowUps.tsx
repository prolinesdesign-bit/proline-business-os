import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getFollowUps, createFollowUp, updateFollowUp, deleteFollowUp } from '../lib/api/followups'
import type { FollowUp, FollowUpFormData, FollowUpWithClient, FollowUpStatus } from '../types'
import FollowUpForm from '../components/followups/FollowUpForm'
import WhatsAppModal from '../components/WhatsAppModal'

const statusColors: Record<FollowUpStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  contacted: 'bg-blue-100 text-blue-800',
  waiting_client: 'bg-purple-100 text-purple-800',
  closed: 'bg-green-100 text-green-800',
}

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'waiting_client', label: 'Waiting Client' },
  { value: 'closed', label: 'Closed' },
]

function formatDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function FollowUps() {
  const { signOut } = useAuth()
  const [followUps, setFollowUps] = useState<FollowUpWithClient[]>([])
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<FollowUp | null>(null)
  const [deleting, setDeleting] = useState<FollowUpWithClient | null>(null)
  const [whatsappTarget, setWhatsappTarget] = useState<FollowUpWithClient | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getFollowUps(statusFilter || undefined)
      setFollowUps(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => { fetch() }, [fetch])

  async function handleSave(data: FollowUpFormData) {
    if (editing) {
      await updateFollowUp(editing.id, data)
    } else {
      await createFollowUp(data)
    }
    setShowForm(false)
    setEditing(null)
    fetch()
  }

  async function handleDelete() {
    if (!deleting) return
    await deleteFollowUp(deleting.id)
    setDeleting(null)
    fetch()
  }

  function openWhatsApp(fu: FollowUpWithClient) {
    setWhatsappTarget(fu)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
        <Link to="/" className="text-xl font-bold">Proline V1</Link>
        <nav className="flex items-center gap-4">
          <Link to="/projects" className="text-sm text-blue-600 hover:underline">Projects</Link>
          <Link to="/clients" className="text-sm text-blue-600 hover:underline">Clients</Link>
          <Link to="/payments" className="text-sm text-blue-600 hover:underline">Payments</Link>
          <Link to="/expenses" className="text-sm text-blue-600 hover:underline">Expenses</Link>
          <Link to="/targets" className="text-sm text-blue-600 hover:underline">Targets</Link>
          <Link to="/tasks" className="text-sm text-blue-600 hover:underline">Tasks</Link>
          <Link to="/calendar" className="text-sm text-blue-600 hover:underline">Calendar</Link>
          <Link to="/documents" className="text-sm text-blue-600 hover:underline">Documents</Link>
          <button onClick={signOut} className="rounded-lg border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50">Logout</button>
        </nav>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="flex items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold">Follow-ups</h1>
          <button onClick={() => setShowForm(true)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            + New Follow-up
          </button>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-gray-600">Filter:</span>
          {STATUS_FILTERS.map(sf => (
            <button
              key={sf.value}
              onClick={() => setStatusFilter(sf.value)}
              className={`rounded-full px-3 py-1 text-sm ${
                statusFilter === sf.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {sf.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-center text-gray-500 py-12">Loading...</p>
        ) : followUps.length === 0 ? (
          <p className="text-center text-gray-500 py-12">No follow-ups found.</p>
        ) : (
          <div className="space-y-3">
            {followUps.map(fu => (
              <div key={fu.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Link to={`/clients`} className="font-semibold text-blue-600 hover:underline">{fu.client_name}</Link>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[fu.status]}`}>
                        {fu.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                      <span>Next: {formatDate(fu.next_follow_up_date)}</span>
                      <span>Last: {formatDate(fu.last_follow_up_date)}</span>
                    </div>
                    {fu.notes && <p className="mt-1 text-sm text-gray-600">{fu.notes}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {fu.client_whatsapp && (
                      <button
                        onClick={() => openWhatsApp(fu)}
                        className="rounded-lg bg-green-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-600"
                      >
                        WhatsApp
                      </button>
                    )}
                    <button onClick={() => { setEditing(fu); setShowForm(true) }} className="text-sm text-blue-600 hover:underline">Edit</button>
                    <button onClick={() => setDeleting(fu)} className="text-sm text-red-600 hover:underline">Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <FollowUpForm
          followUp={editing}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditing(null) }}
        />
      )}

      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold">Delete Follow-up</h2>
            <p className="mt-2 text-sm text-gray-600">
              Delete follow-up for <strong>{deleting.client_name}</strong>? This cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setDeleting(null)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={handleDelete} className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}

      {whatsappTarget?.client_whatsapp && (
        <WhatsAppModal
          phone={whatsappTarget.client_whatsapp}
          clientName={whatsappTarget.client_name}
          onClose={() => setWhatsappTarget(null)}
        />
      )}
    </div>
  )
}
