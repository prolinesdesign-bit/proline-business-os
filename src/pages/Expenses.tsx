import { useEffect, useState, useCallback } from 'react'
import type { Expense, ExpenseFormData, ExpenseSummary, Project } from '../types'
import {
  getExpenses,
  getExpenseSummary,
  createExpense,
  updateExpense,
  deleteExpense,
} from '../lib/api/expenses'
import { getProjects } from '../lib/api/projects'
import ExpenseForm from '../components/expenses/ExpenseForm'

export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [summary, setSummary] = useState<ExpenseSummary | null>(null)
  const [projects, setProjects] = useState<Pick<Project, 'id' | 'name'>[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Expense | null>(null)
  const [deleting, setDeleting] = useState<Expense | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const [e, s, pr] = await Promise.all([
        getExpenses(search),
        getExpenseSummary(),
        getProjects(''),
      ])
      setExpenses(e)
      setSummary(s)
      setProjects(pr)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => { fetch() }, [fetch])

  async function handleSave(data: ExpenseFormData) {
    if (editing) {
      await updateExpense(editing.id, data)
    } else {
      await createExpense(data)
    }
    setShowForm(false)
    setEditing(null)
    fetch()
  }

  async function handleDelete() {
    if (!deleting) return
    await deleteExpense(deleting.id)
    setDeleting(null)
    fetch()
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Expenses</h1>
        <button
          onClick={() => setShowForm(true)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Add Expense
        </button>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="mt-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">This Month</p>
              <p className="mt-1 text-2xl font-bold text-blue-600">${summary.month_total.toLocaleString()}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">This Year</p>
              <p className="mt-1 text-2xl font-bold text-green-600">${summary.year_total.toLocaleString()}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Categories</p>
              <div className="mt-2 space-y-1">
                {summary.by_category.slice(0, 5).map(c => (
                  <div key={c.category} className="flex justify-between text-sm">
                    <span className="text-gray-600">{c.category}</span>
                    <span className="font-medium">${c.total.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <input
        type="text"
        placeholder="Search expenses..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="mt-6 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
      />

      {/* Expenses list */}
      <div className="mt-6">
        {loading ? (
          <p className="text-center text-gray-500">Loading...</p>
        ) : expenses.length === 0 ? (
          <p className="text-center text-gray-500">
            {search ? 'No expenses match your search.' : 'No expenses yet. Click + Add Expense to record one.'}
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-4 py-3 font-medium text-gray-600">Date</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Category</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Amount</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Project</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Description</th>
                  <th className="px-4 py-3 font-medium text-gray-600" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {expenses.map(e => {
                  const project = projects.find(p => p.id === e.project_id)
                  return (
                    <tr key={e.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">{e.expense_date}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                          {e.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap font-medium">${Number(e.amount).toLocaleString()}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-500">{project?.name ?? '—'}</td>
                      <td className="px-4 py-3 max-w-[200px] truncate text-gray-500">{e.description ?? '—'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <button
                          onClick={() => { setEditing(e); setShowForm(true) }}
                          className="text-blue-600 hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleting(e)}
                          className="ml-3 text-red-600 hover:underline"
                        >
                          Delete
                        </button>
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
        <ExpenseForm
          expense={editing}
          projects={projects}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditing(null) }}
        />
      )}

      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold">Delete Expense</h2>
            <p className="mt-2 text-sm text-gray-600">
              Delete ${Number(deleting.amount).toLocaleString()} expense? This cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setDeleting(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
