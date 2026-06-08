import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getDashboardData } from '../lib/api/dashboard'
import type { DashboardData } from '../types'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import AppLayout from '../components/layout/AppLayout'
import { Button } from '../components/ui/Button'
import { Card, CardContent } from '../components/ui/Card'
import { KPISkeleton } from '../components/ui/Skeleton'

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDashboardData()
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
        <p className="text-destructive">Failed to load dashboard data.</p>
      </div>
    )
  }

  const primaryKpis = [
    { label: 'Total Project Value', value: `\u20B9${data.totalProjectValue.toLocaleString()}`, color: 'bg-chart-1' },
    { label: 'Net Profit', value: `\u20B9${data.netProfit.toLocaleString()}`, color: data.netProfit >= 0 ? 'bg-chart-2' : 'bg-chart-6' },
  ]

  const secondaryKpis = [
    { label: 'Total Projects', value: data.totalProjects, color: 'bg-chart-3' },
    { label: 'Active Projects', value: data.activeProjects, color: 'bg-chart-2' },
    { label: 'Total Paid', value: `\u20B9${data.totalPaid.toLocaleString()}`, color: 'bg-chart-2' },
    { label: 'Outstanding Balance', value: `\u20B9${data.outstandingBalance.toLocaleString()}`, color: data.outstandingBalance > 0 ? 'bg-chart-4' : 'bg-chart-2' },
    { label: 'Total Expenses', value: `\u20B9${data.totalExpenses.toLocaleString()}`, color: 'bg-chart-4' },
    { label: 'Due This Week', value: data.projectsDueThisWeek, color: 'bg-chart-6' },
  ]

  const chartData = data.monthlyRevenue.map((r, i) => ({
    month: r.month,
    Revenue: r.revenue,
    Expenses: data.monthlyExpenses[i]?.expenses ?? 0,
    Profit: data.monthlyProfit[i]?.profit ?? 0,
  }))

  const chartColors = {
    revenue: 'var(--color-chart-1)',
    expenses: 'var(--color-chart-4)',
    profit: 'var(--color-chart-2)',
  }

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
    <AppLayout>
      <div className="mx-auto max-w-7xl px-4 py-6">
        <h1 className="mb-6 font-display text-3xl tracking-tight">Dashboard</h1>

        {/* Primary KPI Cards — visually prominent */}
        <div className="mb-4 grid gap-4 sm:grid-cols-2">
          {primaryKpis.map(k => (
            <Card key={k.label} variant="elevated">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className={`h-2 w-2 rounded-full ${k.color}`} />
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{k.label}</p>
                </div>
                <p className="mt-2 font-display text-3xl tracking-tight">{k.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Secondary KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {secondaryKpis.map(k => (
            <Card key={k.label}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`h-3 w-3 rounded-full ${k.color}`} />
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{k.label}</p>
                </div>
                <p className="mt-2 text-2xl font-bold">{k.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts */}
        <div className="mt-8">
          <h2 className="mb-4 font-display text-xl tracking-tight">Monthly Overview</h2>
          <div className="grid gap-6 lg:grid-cols-3">
            <Card>
              <CardContent className="p-4">
                <h3 className="mb-3 text-sm font-medium text-muted-foreground">Revenue</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }} />
                    <YAxis tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }} />
                    <Tooltip />
                    <Bar dataKey="Revenue" fill={chartColors.revenue} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <h3 className="mb-3 text-sm font-medium text-muted-foreground">Expenses</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }} />
                    <YAxis tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }} />
                    <Tooltip />
                    <Bar dataKey="Expenses" fill={chartColors.expenses} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <h3 className="mb-3 text-sm font-medium text-muted-foreground">Profit</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }} />
                    <YAxis tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }} />
                    <Tooltip />
                    <Bar dataKey="Profit" fill={chartColors.profit} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Widgets — Executive Overview */}
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {/* Monthly Target Progress */}
          <Card className="lg:col-span-2" variant="elevated">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display text-lg tracking-tight">Monthly Target Progress</h3>
                <Button variant="link" size="sm" asChild>
                  <Link to="/targets">Manage targets</Link>
                </Button>
              </div>
              {data.targetProgress && data.targetProgress.target ? (
                <div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Target</p>
                      <p className="text-lg font-bold">\u20B9{Math.round(data.targetProgress.target.target_value).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Current</p>
                      <p className="text-lg font-bold text-success">\u20B9{Math.round(data.targetProgress.currentRevenue).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Remaining</p>
                      <p className="text-lg font-bold text-warning">\u20B9{Math.round(data.targetProgress.remaining).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Daily Needed</p>
                      <p className="text-lg font-bold text-chart-4">\u20B9{Math.round(data.targetProgress.dailyNeeded).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full transition-all ${
                          data.targetProgress.percentage >= 100 ? 'bg-success' :
                          data.targetProgress.percentage >= 75 ? 'bg-primary' :
                          data.targetProgress.percentage >= 50 ? 'bg-chart-4' :
                          'bg-chart-6'
                        }`}
                        style={{ width: `${Math.min(100, data.targetProgress.percentage)}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{data.targetProgress.percentage}%</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No target set for this month. <Button variant="link" size="sm" asChild><Link to="/targets">Set one now.</Link></Button></p>
              )}
            </CardContent>
          </Card>

          {/* Overdue Projects */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-destructive">Overdue Projects</h3>
                <Button variant="link" size="sm" asChild>
                  <Link to="/projects">View all</Link>
                </Button>
              </div>
              {data.overdueProjects.length === 0 ? (
                <p className="text-sm text-muted-foreground">No overdue projects.</p>
              ) : (
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {data.overdueProjects.map(p => (
                    <div key={p.id} className="flex items-center justify-between rounded-lg bg-destructive-light px-3 py-2">
                      <Link to={`/project/${p.id}`} className="text-sm font-medium text-primary hover:underline">{p.name}</Link>
                      <p className="text-xs text-destructive">{p.end_date ? daysUntil(p.end_date) : ''}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Due Dates */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Upcoming Due Dates</h3>
                <Button variant="link" size="sm" asChild>
                  <Link to="/projects">View all</Link>
                </Button>
              </div>
              {data.upcomingDueDates.length === 0 ? (
                <p className="text-sm text-muted-foreground">No upcoming due dates.</p>
              ) : (
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {data.upcomingDueDates.slice(0, 5).map(p => (
                    <div key={p.id} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                      <Link to={`/project/${p.id}`} className="text-sm font-medium text-primary hover:underline">{p.name}</Link>
                      <div className="text-right">
                        <p className="text-sm font-medium">{formatDate(p.end_date!)}</p>
                        <p className={`text-xs font-medium ${
                          daysUntil(p.end_date!) === 'Overdue' ? 'text-destructive' :
                          daysUntil(p.end_date!).includes('Today') || daysUntil(p.end_date!).includes('Tomorrow') ? 'text-chart-4' :
                          'text-muted-foreground'
                        }`}>
                          {daysUntil(p.end_date!)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}
