import { useEffect, useState } from 'react'
import { getAnalyticsData } from '../lib/api/analytics'
import type { AnalyticsData } from '../types'
import AppLayout from '../components/layout/AppLayout'
import { Card, CardContent } from '../components/ui/Card'
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { KPISkeleton } from '../components/ui/Skeleton'
import { EmptyState } from '../components/ui/EmptyState'

const STATUS_COLORS: Record<string, string> = {
  active: '#22c55e',
  completed: '#3b82f6',
  on_hold: '#f59e0b',
  cancelled: '#ef4444',
}

function fmt(n: number) {
  return `₹${Math.round(n).toLocaleString()}`
}

export default function Analytics() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAnalyticsData()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <KPISkeleton />
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <EmptyState title="Failed to load analytics" description="Something went wrong. Please try again." />
      </div>
    )
  }

  const metricCards = [
    { label: 'Total Revenue', value: fmt(data.totalRevenue), color: 'bg-green-500' },
    { label: 'Total Expenses', value: fmt(data.totalExpenses), color: 'bg-orange-500' },
    { label: 'Net Profit', value: fmt(data.netProfit), color: data.netProfit >= 0 ? 'bg-green-600' : 'bg-red-600' },
    { label: 'Outstanding Balance', value: fmt(data.outstandingBalance), color: data.outstandingBalance > 0 ? 'bg-amber-500' : 'bg-emerald-500' },
    { label: 'Avg Project Value', value: fmt(data.averageProjectValue), color: 'bg-indigo-500' },
    { label: 'Collection Rate', value: `${data.collectionRate}%`, color: 'bg-purple-500' },
  ]

  const insightCards = [
    { label: 'Top Client', value: data.topClient ? `${data.topClient.name} (${fmt(data.topClient.revenue)})` : 'N/A' },
    { label: 'Top Project Status', value: data.topProjectStatus ? `${data.topProjectStatus.status} (${fmt(data.topProjectStatus.revenue)})` : 'N/A' },
    { label: 'Overdue Projects', value: data.overdueProjectsCount.toString(), urgent: data.overdueProjectsCount > 0 },
    { label: 'Pending Collection', value: fmt(data.pendingCollectionAmount), urgent: data.pendingCollectionAmount > 0 },
  ]

  const chartData = data.monthlyRevenue.map((r, i) => ({
    month: r.month,
    Revenue: r.revenue,
    Expenses: data.monthlyExpenses[i]?.expenses ?? 0,
    Profit: data.monthlyProfit[i]?.profit ?? 0,
  }))

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl px-4 py-6">
        <h1 className="mb-6 text-2xl font-bold">Business Analytics</h1>

        {/* Metrics */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {metricCards.map(m => (
            <Card key={m.label}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`h-3 w-3 rounded-full ${m.color}`} />
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{m.label}</p>
                </div>
                <p className="mt-2 text-2xl font-bold">{m.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Insights */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {insightCards.map(ic => (
            <Card key={ic.label}>
              <CardContent className="p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{ic.label}</p>
                <p className={`mt-1 text-lg font-bold ${ic.urgent ? 'text-destructive' : ''}`}>{ic.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Monthly Charts */}
        <div className="mt-8">
          <h2 className="mb-4 text-lg font-semibold">Monthly Overview</h2>
          <div className="grid gap-6 lg:grid-cols-3">
            <Card>
              <CardContent className="p-4">
                <h3 className="mb-3 text-sm font-medium text-gray-600">Revenue</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <h3 className="mb-3 text-sm font-medium text-gray-600">Expenses</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="Expenses" fill="#f97316" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <h3 className="mb-3 text-sm font-medium text-gray-600">Profit</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="Profit" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Additional Charts */}
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {/* Project Status Distribution */}
          <Card>
            <CardContent className="p-4">
              <h3 className="mb-3 text-sm font-medium text-gray-600">Project Status Distribution</h3>
              {data.projectStatusDistribution.length === 0 ? (
                <EmptyState title="No data" description="No data available for this chart." />
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={data.projectStatusDistribution}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {data.projectStatusDistribution.map((entry) => (
                        <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? '#9ca3af'} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Revenue by Client */}
          <Card>
            <CardContent className="p-4">
              <h3 className="mb-3 text-sm font-medium text-gray-600">Revenue by Client</h3>
              {data.revenueByClient.length === 0 ? (
                <EmptyState title="No data" description="No data available for this chart." />
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={data.revenueByClient.slice(0, 8)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="client" tick={{ fontSize: 11 }} width={100} />
                    <Tooltip />
                    <Bar dataKey="revenue" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Revenue by Project Status */}
          <Card>
            <CardContent className="p-4">
              <h3 className="mb-3 text-sm font-medium text-gray-600">Revenue by Project Status</h3>
              {data.revenueByProjectStatus.length === 0 ? (
                <EmptyState title="No data" description="No data available for this chart." />
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={data.revenueByProjectStatus}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="status" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                      {data.revenueByProjectStatus.map((entry) => (
                        <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? '#9ca3af'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}
