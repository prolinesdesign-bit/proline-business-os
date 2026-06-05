import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getDashboardData } from '../lib/api/dashboard'
import type { DashboardData } from '../types'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

export default function Dashboard() {
  const { signOut } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDashboardData()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-red-500">Failed to load dashboard data.</p>
      </div>
    )
  }

  const kpis = [
    { label: 'Total Projects', value: data.totalProjects, color: 'bg-blue-500' },
    { label: 'Active Projects', value: data.activeProjects, color: 'bg-green-500' },
    { label: 'Total Project Value', value: `₹${data.totalProjectValue.toLocaleString()}`, color: 'bg-indigo-500' },
    { label: 'Total Paid', value: `₹${data.totalPaid.toLocaleString()}`, color: 'bg-emerald-500' },
    { label: 'Outstanding Balance', value: `₹${data.outstandingBalance.toLocaleString()}`, color: data.outstandingBalance > 0 ? 'bg-amber-500' : 'bg-emerald-500' },
    { label: 'Total Expenses', value: `₹${data.totalExpenses.toLocaleString()}`, color: 'bg-orange-500' },
    { label: 'Net Profit', value: `₹${data.netProfit.toLocaleString()}`, color: data.netProfit >= 0 ? 'bg-green-600' : 'bg-red-600' },
    { label: 'Due This Week', value: data.projectsDueThisWeek, color: 'bg-rose-500' },
  ]

  const chartData = data.monthlyRevenue.map((r, i) => ({
    month: r.month,
    Revenue: r.revenue,
    Expenses: data.monthlyExpenses[i]?.expenses ?? 0,
    Profit: data.monthlyProfit[i]?.profit ?? 0,
  }))

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  function daysUntil(d: string) {
    const diff = new Date(d).getTime() - Date.now()
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    if (days < 0) return 'Overdue'
    if (days === 0) return 'Today'
    if (days === 1) return 'Tomorrow'
    return `${days} days`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
        <Link to="/dashboard" className="text-xl font-bold">Proline V1</Link>
        <nav className="flex items-center gap-4">
          <Link to="/projects" className="text-sm text-blue-600 hover:underline">Projects</Link>
          <Link to="/clients" className="text-sm text-blue-600 hover:underline">Clients</Link>
          <Link to="/payments" className="text-sm text-blue-600 hover:underline">Payments</Link>
          <Link to="/expenses" className="text-sm text-blue-600 hover:underline">Expenses</Link>
          <Link to="/targets" className="text-sm text-blue-600 hover:underline">Targets</Link>
          <Link to="/tasks" className="text-sm text-blue-600 hover:underline">Tasks</Link>
          <Link to="/calendar" className="text-sm text-blue-600 hover:underline">Calendar</Link>
          <Link to="/documents" className="text-sm text-blue-600 hover:underline">Documents</Link>
          <button onClick={signOut} className="rounded-lg border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50">
            Logout
          </button>
        </nav>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6">
        <h1 className="mb-6 text-2xl font-bold">Dashboard</h1>

        {/* KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map(k => (
            <div key={k.label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className={`h-3 w-3 rounded-full ${k.color}`} />
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{k.label}</p>
              </div>
              <p className="mt-2 text-2xl font-bold">{k.value}</p>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="mt-8">
          <h2 className="mb-4 text-lg font-semibold">Monthly Overview</h2>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-sm font-medium text-gray-600">Revenue</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-sm font-medium text-gray-600">Expenses</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="Expenses" fill="#f97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-sm font-medium text-gray-600">Profit</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="Profit" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Widgets */}
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {/* Target Progress */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm lg:col-span-3">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Monthly Target Progress</h3>
              <Link to="/targets" className="text-xs text-blue-600 hover:underline">Manage targets</Link>
            </div>
            {data.targetProgress && data.targetProgress.target ? (
              <div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-3">
                  <div>
                    <p className="text-xs text-gray-500">Target</p>
                    <p className="text-lg font-bold">₹{Math.round(data.targetProgress.target.target_value).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Current</p>
                    <p className="text-lg font-bold text-green-600">₹{Math.round(data.targetProgress.currentRevenue).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Remaining</p>
                    <p className="text-lg font-bold text-amber-600">₹{Math.round(data.targetProgress.remaining).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Daily Needed</p>
                    <p className="text-lg font-bold text-orange-600">₹{Math.round(data.targetProgress.dailyNeeded).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2.5 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className={`h-full rounded-full transition-all ${
                        data.targetProgress.percentage >= 100 ? 'bg-green-500' :
                        data.targetProgress.percentage >= 75 ? 'bg-blue-500' :
                        data.targetProgress.percentage >= 50 ? 'bg-amber-500' :
                        'bg-orange-500'
                      }`}
                      style={{ width: `${Math.min(100, data.targetProgress.percentage)}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{data.targetProgress.percentage}%</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No target set for this month. <Link to="/targets" className="text-blue-600 hover:underline">Set one now.</Link></p>
            )}
          </div>

          {/* Overdue Projects */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-red-700">Overdue Projects</h3>
              <Link to="/projects" className="text-xs text-blue-600 hover:underline">View all</Link>
            </div>
            {data.overdueProjects.length === 0 ? (
              <p className="text-sm text-gray-500">No overdue projects.</p>
            ) : (
              <div className="space-y-2">
                {data.overdueProjects.map(p => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg bg-red-50 px-3 py-2">
                    <div>
                      <p className="text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-red-600">{p.end_date ? daysUntil(p.end_date) : ''}</p>
                    </div>
                    <p className="text-xs text-red-600">{formatDate(p.end_date!)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming & Due This Week */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Upcoming Due Dates</h3>
              <Link to="/projects" className="text-xs text-blue-600 hover:underline">View all</Link>
            </div>
            {data.upcomingDueDates.length === 0 ? (
              <p className="text-sm text-gray-500">No upcoming due dates.</p>
            ) : (
              <div className="space-y-2">
                {data.upcomingDueDates.slice(0, 5).map(p => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                    <div>
                      <p className="text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-gray-500">{p.client_name ?? 'No client'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{formatDate(p.end_date!)}</p>
                      <p className={`text-xs font-medium ${
                        daysUntil(p.end_date!) === 'Overdue' ? 'text-red-600' :
                        daysUntil(p.end_date!).includes('Today') || daysUntil(p.end_date!).includes('Tomorrow') ? 'text-orange-600' :
                        'text-gray-500'
                      }`}>
                        {daysUntil(p.end_date!)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Activity combined */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Recent Payments</h3>
              <Link to="/payments" className="text-xs text-blue-600 hover:underline">View all</Link>
            </div>
            {data.recentPayments.length === 0 ? (
              <p className="text-sm text-gray-500">No payments yet.</p>
            ) : (
              <div className="space-y-2">
                {data.recentPayments.map(p => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                    <div>
                      <p className="text-sm font-medium">₹{Number(p.amount).toLocaleString()}</p>
                      <p className="text-xs text-gray-500">{formatDate(p.payment_date)}</p>
                    </div>
                    <p className="text-xs text-gray-500 truncate max-w-[120px]">{p.description ?? '—'}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Expenses */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Recent Expenses</h3>
              <Link to="/expenses" className="text-xs text-blue-600 hover:underline">View all</Link>
            </div>
            {data.recentExpenses.length === 0 ? (
              <p className="text-sm text-gray-500">No expenses yet.</p>
            ) : (
              <div className="space-y-2">
                {data.recentExpenses.map(e => (
                  <div key={e.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                    <div>
                      <p className="text-sm font-medium">₹{Number(e.amount).toLocaleString()}</p>
                      <p className="text-xs text-gray-500">{formatDate(e.expense_date)}</p>
                    </div>
                    <div className="text-right">
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                        {e.category}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
