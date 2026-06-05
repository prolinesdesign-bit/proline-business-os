import { useEffect, useState, useCallback } from 'react'
import type { Payment, PaymentFormData, ProjectPaymentSummary, Project } from '../types'
import { getPayments, getProjectSummaries, createPayment, updatePayment, deletePayment } from '../lib/api/payments'
import { getProjects } from '../lib/api/projects'
import PaymentForm from '../components/payments/PaymentForm'

export default function Payments() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [summaries, setSummaries] = useState<ProjectPaymentSummary[]>([])
  const [projects, setProjects] = useState<Pick<Project, 'id' | 'name'>[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Payment | null>(null)
  const [deleting, setDeleting] = useState<Payment | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const [p, s, pr] = await Promise.all([
        getPayments(),
        getProjectSummaries(),
        getProjects(''),
      ])
      setPayments(p)
      setSummaries(s)
      setProjects(pr)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  async function handleSave(data: PaymentFormData) {
    if (editing) {
      await updatePayment(editing.id, data)
    } else {
      await createPayment(data)
    }
    setShowForm(false)
    setEditing(null)
    fetch()
  }

  async function handleDelete() {
    if (!deleting) return
    await deletePayment(deleting.id)
    setDeleting(null)
    fetch()
  }

  const totalOutstanding = summaries.reduce((sum, s) => sum + s.balance_due, 0)

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Payments</h1>
        <button
          onClick={() => setShowForm(true)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Add Payment
        </button>
      </div>

      {/* Project payment summary cards */}
      {summaries.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-3 text-lg font-semibold">Project Payment Summary</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {summaries.map(s => (
              <div key={s.project_id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <h3 className="truncate text-sm font-semibold text-gray-700">{s.project_name}</h3>
                <div className="mt-2 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Project Value</span>
                    <span className="font-medium">₹{s.project_value.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total Paid</span>
                    <span className="font-medium text-green-600">₹{s.total_paid.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-100 pt-1">
                    <span className="text-gray-500">Balance Due</span>
                    <span className={`font-semibold ${s.balance_due > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      ₹{s.balance_due.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 text-right text-sm text-gray-500">
            Total Outstanding: <span className="font-semibold text-red-600">₹{totalOutstanding.toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Payments list */}
      <div className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">All Payments</h2>

        {loading ? (
          <p className="text-center text-gray-500">Loading...</p>
        ) : payments.length === 0 ? (
          <p className="text-center text-gray-500">No payments yet. Click + Add Payment to record one.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-4 py-3 font-medium text-gray-600">Date</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Project</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Amount</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Notes</th>
                  <th className="px-4 py-3 font-medium text-gray-600" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payments.map(p => {
                  const project = projects.find(pr => pr.id === p.project_id)
                  return (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">{p.payment_date}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{project?.name ?? '—'}</td>
                      <td className="px-4 py-3 whitespace-nowrap font-medium">₹{Number(p.amount).toLocaleString()}</td>
                      <td className="px-4 py-3 max-w-[200px] truncate text-gray-500">{p.description ?? '—'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <button onClick={() => { setEditing(p); setShowForm(true) }} className="text-blue-600 hover:underline">Edit</button>
                        <button onClick={() => setDeleting(p)} className="ml-3 text-red-600 hover:underline">Delete</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <PaymentForm
          projects={projects}
          payment={editing}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditing(null) }}
        />
      )}

      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold">Delete Payment</h2>
            <p className="mt-2 text-sm text-gray-600">
              Delete ₹{Number(deleting.amount).toLocaleString()} payment? This cannot be undone.
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
