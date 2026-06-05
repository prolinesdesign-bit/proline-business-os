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
import { Badge } from '../components/ui/Badge'
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
    <AppLayout>
      <div className="mx-auto max-w-7xl px-4 py-6">
        <h1 className="mb-6 text-2xl font-bold">Dashboard</h1>

        {/* KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map(k => (
            <Card key={k.label}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`h-3 w-3 rounded-full ${k.color}`} />
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{k.label}</p>
                </div>
                <p className="mt-2 text-2xl font-bold">{k.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts */}
        <div className="mt-8">
          <h2 className="mb-4 text-lg font-semibold">Monthly Overview</h2>
          <div className="grid gap-6 lg:grid-cols-3">
            <Card>
              <CardContent className="p-4">
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
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
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
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
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
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Widgets */}
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {/* Target Progress */}
          <Card className="lg:col-span-3">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Monthly Target Progress</h3>
                <Button variant="link" size="sm" asChild>
                  <Link to="/targets">Manage targets</Link>
                </Button>
              </div>
              {data.targetProgress && data.targetProgress.target ? (
                <div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Target</p>
                      <p className="text-lg font-bold">₹{Math.round(data.targetProgress.target.target_value).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Current</p>
                      <p className="text-lg font-bold text-green-600">₹{Math.round(data.targetProgress.currentRevenue).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Remaining</p>
                      <p className="text-lg font-bold text-amber-600">₹{Math.round(data.targetProgress.remaining).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Daily Needed</p>
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
                <p className="text-sm text-muted-foreground">No target set for this month. <Button variant="link" size="sm" asChild><Link to="/targets">Set one now.</Link></Button></p>
              )}
            </CardContent>
          </Card>

          {/* Overdue Projects */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-red-700">Overdue Projects</h3>
                <Button variant="link" size="sm" asChild>
                  <Link to="/projects">View all</Link>
                </Button>
              </div>
              {data.overdueProjects.length === 0 ? (
                <p className="text-sm text-muted-foreground">No overdue projects.</p>
              ) : (
                <div className="space-y-2">
                  {data.overdueProjects.map(p => (
                    <div key={p.id} className="flex items-center justify-between rounded-lg bg-red-50 px-3 py-2">
                      <div>
                        <p className="text-sm font-medium">{p.name}</p>
                        <p className="text-xs text-destructive">{p.end_date ? daysUntil(p.end_date) : ''}</p>
                      </div>
                      <p className="text-xs text-destructive">{formatDate(p.end_date!)}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming & Due This Week */}
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
                <div className="space-y-2">
                  {data.upcomingDueDates.slice(0, 5).map(p => (
                    <div key={p.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                      <div>
                        <p className="text-sm font-medium">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.client_name ?? 'No client'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{formatDate(p.end_date!)}</p>
                        <p className={`text-xs font-medium ${
                          daysUntil(p.end_date!) === 'Overdue' ? 'text-destructive' :
                          daysUntil(p.end_date!).includes('Today') || daysUntil(p.end_date!).includes('Tomorrow') ? 'text-orange-600' :
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

          {/* Site Visits */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-purple-700">Site Visits This Month</h3>
                <Button variant="link" size="sm" asChild>
                  <Link to="/sitevisits">View all</Link>
                </Button>
              </div>
              <p className={`text-3xl font-bold ${data.siteVisitsThisMonth > 0 ? 'text-purple-600' : 'text-gray-400'}`}>
                {data.siteVisitsThisMonth}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-purple-700">Upcoming Site Visits</h3>
                <Button variant="link" size="sm" asChild>
                  <Link to="/sitevisits">View all</Link>
                </Button>
              </div>
              {data.upcomingSiteVisits.length === 0 ? (
                <p className="text-sm text-muted-foreground">No upcoming site visits.</p>
              ) : (
                <div className="space-y-2 max-h-[180px] overflow-y-auto">
                  {data.upcomingSiteVisits.map(sv => (
                    <div key={sv.id} className="rounded-lg bg-purple-50 px-3 py-2 text-sm">
                      <p className="font-medium text-purple-800">{sv.location || 'Unknown location'}</p>
                      <p className="text-xs text-purple-600">{formatDate(sv.visit_date)} &middot; {sv.site_status?.replace('_', ' ')}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Follow-ups */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-orange-700">Follow-ups Due Today</h3>
                <Button variant="link" size="sm" asChild>
                  <Link to="/followups">View all</Link>
                </Button>
              </div>
              <p className={`text-3xl font-bold ${data.followUpsDueToday > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                {data.followUpsDueToday}
              </p>
              {data.followUpsDueToday > 0 && (
                <p className="text-xs text-orange-600 mt-1">Follow-ups need attention today</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-red-700">Overdue Follow-ups</h3>
                <Button variant="link" size="sm" asChild>
                  <Link to="/followups">View all</Link>
                </Button>
              </div>
              {data.overdueFollowUps.length === 0 ? (
                <p className="text-sm text-muted-foreground">No overdue follow-ups.</p>
              ) : (
                <div className="space-y-2 max-h-[180px] overflow-y-auto">
                  {data.overdueFollowUps.map(f => (
                    <div key={f.id} className="rounded-lg bg-red-50 px-3 py-2 text-sm">
                      <p className="font-medium text-red-800">Client #{f.client_id.slice(0, 8)}</p>
                      <p className="text-xs text-destructive">
                        Due {formatDate(f.next_follow_up_date!)} &middot; {f.status?.replace('_', ' ')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Upcoming Follow-ups</h3>
                <Button variant="link" size="sm" asChild>
                  <Link to="/followups">View all</Link>
                </Button>
              </div>
              {data.upcomingFollowUps.length === 0 ? (
                <p className="text-sm text-muted-foreground">No upcoming follow-ups.</p>
              ) : (
                <div className="space-y-2 max-h-[180px] overflow-y-auto">
                  {data.upcomingFollowUps.map(f => (
                    <div key={f.id} className="rounded-lg bg-gray-50 px-3 py-2 text-sm">
                      <p className="font-medium">Client #{f.client_id.slice(0, 8)}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(f.next_follow_up_date!)} &middot; {f.status?.replace('_', ' ')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Payments */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Recent Payments</h3>
                <Button variant="link" size="sm" asChild>
                  <Link to="/payments">View all</Link>
                </Button>
              </div>
              {data.recentPayments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No payments yet.</p>
              ) : (
                <div className="space-y-2">
                  {data.recentPayments.map(p => (
                    <div key={p.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                      <div>
                        <p className="text-sm font-medium">₹{Number(p.amount).toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(p.payment_date)}</p>
                      </div>
                      <p className="text-xs text-muted-foreground truncate max-w-[120px]">{p.description ?? '—'}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Expenses */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Recent Expenses</h3>
                <Button variant="link" size="sm" asChild>
                  <Link to="/expenses">View all</Link>
                </Button>
              </div>
              {data.recentExpenses.length === 0 ? (
                <p className="text-sm text-muted-foreground">No expenses yet.</p>
              ) : (
                <div className="space-y-2">
                  {data.recentExpenses.map(e => (
                    <div key={e.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                      <div>
                        <p className="text-sm font-medium">₹{Number(e.amount).toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(e.expense_date)}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary">
                          {e.category}
                        </Badge>
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
