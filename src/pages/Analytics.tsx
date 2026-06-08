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

const CHART_COLORS = [
  'var(--color-chart-1)',
  'var(--color-chart-2)',
  'var(--color-chart-3)',
  'var(--color-chart-4)',
  'var(--color-chart-5)',
  'var(--color-chart-6)',
]

function fmt(n: number) {
  return `\u20B9${Math.round(n).toLocaleString()}`
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
    { label: 'Total Revenue', value: fmt(data.totalRevenue), color: 'bg-chart-2' },
    { label: 'Total Expenses', value: fmt(data.totalExpenses), color: 'bg-chart-4' },
    { label: 'Net Profit', value: fmt(data.netProfit), color: data.netProfit >= 0 ? 'bg-chart-2' : 'bg-chart-6' },
    { label: 'Outstanding Balance', value: fmt(data.outstandingBalance), color: data.outstandingBalance > 0 ? 'bg-chart-4' : 'bg-chart-2' },
    { label: 'Avg Project Value', value: fmt(data.averageProjectValue), color: 'bg-chart-3' },
    { label: 'Collection Rate', value: `${data.collectionRate}%`, color: 'bg-chart-5' },
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
        <h1 className="mb-6 font-display text-3xl tracking-tight">Business Analytics</h1>

        {/* Metrics */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {metricCards.map(m => (
            <Card key={m.label} variant="elevated">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`h-2 w-2 rounded-full ${m.color}`} />
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{m.label}</p>
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
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{ic.label}</p>
                <p className={`mt-1 text-lg font-bold ${ic.urgent ? 'text-destructive' : ''}`}>{ic.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Monthly Charts */}
        <div className="mt-8">
          <h2 className="mb-4 font-display text-xl tracking-tight">Monthly Overview</h2>
          <div className="grid gap-6 lg:grid-cols-3">
            <Card>
              <CardContent className="p-4">
                <h3 className="mb-3 text-sm font-medium text-muted-foreground">Revenue</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }} />
                    <YAxis tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }} />
                    <Tooltip />
                    <Bar dataKey="Revenue" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <h3 className="mb-3 text-sm font-medium text-muted-foreground">Expenses</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }} />
                    <YAxis tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }} />
                    <Tooltip />
                    <Bar dataKey="Expenses" fill="var(--color-chart-4)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <h3 className="mb-3 text-sm font-medium text-muted-foreground">Profit</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }} />
                    <YAxis tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }} />
                    <Tooltip />
                    <Bar dataKey="Profit" fill="var(--color-chart-2)" radius={[4, 4, 0, 0]} />
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
              <h3 className="mb-3 text-sm font-medium text-muted-foreground">Project Status Distribution</h3>
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
                      {data.projectStatusDistribution.map((entry, idx) => (
                        <Cell key={entry.name} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
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
              <h3 className="mb-3 text-sm font-medium text-muted-foreground">Revenue by Client</h3>
              {data.revenueByClient.length === 0 ? (
                <EmptyState title="No data" description="No data available for this chart." />
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={data.revenueByClient.slice(0, 8)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} />
                    <YAxis type="category" dataKey="client" tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} width={100} />
                    <Tooltip />
                    <Bar dataKey="revenue" fill="var(--color-chart-5)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Revenue by Project Status */}
          <Card>
            <CardContent className="p-4">
              <h3 className="mb-3 text-sm font-medium text-muted-foreground">Revenue by Project Status</h3>
              {data.revenueByProjectStatus.length === 0 ? (
                <EmptyState title="No data" description="No data available for this chart." />
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={data.revenueByProjectStatus}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="status" tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }} />
                    <YAxis tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }} />
                    <Tooltip />
                    <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                      {data.revenueByProjectStatus.map((entry, idx) => (
                        <Cell key={entry.status} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
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
