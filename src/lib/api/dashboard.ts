import { supabase } from '../supabase'
import type { DashboardData, TargetProgress } from '../../types'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function getWeekBounds() {
  const now = new Date()
  const day = now.getDay()
  const diff = (day + 6) % 7
  const monday = new Date(now)
  monday.setDate(now.getDate() - diff)
  monday.setHours(0, 0, 0, 0)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)
  return { monday, sunday }
}

function startOfYear() {
  const d = new Date()
  d.setMonth(0, 1)
  d.setHours(0, 0, 0, 0)
  return d
}

async function getTargetProgress(): Promise<TargetProgress | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)

  const [targetsRes, paymentsRes] = await Promise.all([
    supabase
      .from('targets')
      .select('*')
      .eq('target_type', 'revenue')
      .eq('user_id', user.id)
      .lte('start_date', monthEnd)
      .gte('end_date', monthStart)
      .order('created_at', { ascending: false })
      .limit(1),
    supabase
      .from('payments')
      .select('amount')
      .eq('status', 'completed')
      .gte('payment_date', monthStart)
      .lte('payment_date', monthEnd),
  ])

  if (targetsRes.error) throw targetsRes.error
  if (paymentsRes.error) throw paymentsRes.error

  const target = targetsRes.data?.[0] ?? null
  const currentRevenue = (paymentsRes.data ?? []).reduce((s, p) => s + Number(p.amount), 0)

  if (!target) {
    return { target: null, currentRevenue, remaining: 0, percentage: 0, dailyNeeded: 0 }
  }

  const targetVal = Number(target.target_value)
  const remaining = Math.max(0, targetVal - currentRevenue)
  const percentage = targetVal > 0 ? Math.min(100, Math.round((currentRevenue / targetVal) * 100)) : 0

  const daysLeft = Math.ceil(
    (new Date(monthEnd).getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  )
  const dailyNeeded = daysLeft > 0 && remaining > 0 ? remaining / daysLeft : 0

  return {
    target,
    currentRevenue,
    remaining,
    percentage,
    dailyNeeded: Math.round(dailyNeeded * 100) / 100,
  }
}

export async function getDashboardData(): Promise<DashboardData> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const today = new Date().toISOString().slice(0, 10)

  const [projectsRes, paymentsRes, expensesRes, targetProgress, followUpsRes] = await Promise.all([
    supabase
      .from('projects')
      .select('id, name, status, budget, end_date, client_name'),
    supabase
      .from('payments')
      .select('id, amount, payment_date, description, project_id')
      .eq('status', 'completed'),
    supabase
      .from('expenses')
      .select('id, amount, expense_date, category, description, project_id'),
    getTargetProgress(),
    supabase
      .from('follow_ups')
      .select('id, client_id, next_follow_up_date, status, notes')
      .neq('status', 'closed')
      .order('next_follow_up_date', { ascending: true }),
  ])

  if (projectsRes.error) throw projectsRes.error
  if (paymentsRes.error) throw paymentsRes.error
  if (expensesRes.error) throw expensesRes.error
  if (followUpsRes.error) throw followUpsRes.error

  const projects = projectsRes.data ?? []
  const payments = paymentsRes.data ?? []
  const expenses = expensesRes.data ?? []
  const followUps = followUpsRes.data ?? []

  // KPI calculations
  const totalProjects = projects.length
  const activeProjects = projects.filter(p => p.status === 'active').length
  const totalProjectValue = projects.reduce((s, p) => s + Number(p.budget ?? 0), 0)
  const totalPaid = payments.reduce((s, p) => s + Number(p.amount), 0)
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0)
  const outstandingBalance = totalProjectValue - totalPaid
  const netProfit = totalPaid - totalExpenses

  // Projects due this week
  const { monday, sunday } = getWeekBounds()
  const projectsDueThisWeek = projects.filter(p => {
    if (!p.end_date) return false
    const d = new Date(p.end_date)
    return d >= monday && d <= sunday
  }).length

  // Monthly chart data (current year)
  const yearStart = startOfYear()
  const yearEnd = new Date(yearStart.getFullYear() + 1, 0, 1)

  const monthlyRevenue = new Array(12).fill(0)
  for (const p of payments) {
    const d = new Date(p.payment_date)
    if (d >= yearStart && d < yearEnd) {
      monthlyRevenue[d.getMonth()] += Number(p.amount)
    }
  }

  const monthlyExpensesArr = new Array(12).fill(0)
  for (const e of expenses) {
    const d = new Date(e.expense_date)
    if (d >= yearStart && d < yearEnd) {
      monthlyExpensesArr[d.getMonth()] += Number(e.amount)
    }
  }

  const monthlyRevenueData = monthlyRevenue.map((v, i) => ({ month: MONTHS[i], revenue: Math.round(v * 100) / 100 }))
  const monthlyExpensesData = monthlyExpensesArr.map((v, i) => ({ month: MONTHS[i], expenses: Math.round(v * 100) / 100 }))
  const monthlyProfitData = monthlyRevenue.map((v, i) => ({
    month: MONTHS[i],
    profit: Math.round((v - monthlyExpensesArr[i]) * 100) / 100,
  }))

  // Recent items
  const sortedProjects = [...projects].sort((a, b) => {
    const da = a.end_date ? new Date(a.end_date).getTime() : 0
    const db = b.end_date ? new Date(b.end_date).getTime() : 0
    return db - da
  })
  const sortedPayments = [...payments].sort(
    (a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime(),
  )
  const sortedExpenses = [...expenses].sort(
    (a, b) => new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime(),
  )

  // Upcoming due dates
  const now = new Date()
  const upcoming = [...projects]
    .filter(p => p.end_date && new Date(p.end_date) >= now)
    .sort((a, b) => new Date(a.end_date!).getTime() - new Date(b.end_date!).getTime())

  // Overdue projects (past end_date, not completed/cancelled)
  const overdue = projects.filter(p => {
    if (!p.end_date) return false
    return p.status !== 'completed' && p.status !== 'cancelled' && new Date(p.end_date) < now
  })

  // Follow-up widgets
  const followUpsDueToday = followUps.filter(f => f.next_follow_up_date === today).length

  const overdueFollowUps = followUps
    .filter(f => f.next_follow_up_date && f.next_follow_up_date < today)
    .slice(0, 5)
    .map(f => ({ id: f.id, client_id: f.client_id, next_follow_up_date: f.next_follow_up_date, status: f.status as DashboardData['overdueFollowUps'][0]['status'], notes: f.notes }))

  const upcomingFollowUps = followUps
    .filter(f => f.next_follow_up_date && f.next_follow_up_date >= today)
    .slice(0, 5)
    .map(f => ({ id: f.id, client_id: f.client_id, next_follow_up_date: f.next_follow_up_date, status: f.status as DashboardData['overdueFollowUps'][0]['status'], notes: f.notes }))

  return {
    totalProjects,
    activeProjects,
    totalProjectValue: Math.round(totalProjectValue * 100) / 100,
    totalPaid: Math.round(totalPaid * 100) / 100,
    outstandingBalance: Math.round(outstandingBalance * 100) / 100,
    totalExpenses: Math.round(totalExpenses * 100) / 100,
    netProfit: Math.round(netProfit * 100) / 100,
    projectsDueThisWeek,
    monthlyRevenue: monthlyRevenueData,
    monthlyExpenses: monthlyExpensesData,
    monthlyProfit: monthlyProfitData,
    recentProjects: sortedProjects.slice(0, 5),
    recentPayments: sortedPayments.slice(0, 5),
    recentExpenses: sortedExpenses.slice(0, 5),
    upcomingDueDates: upcoming.slice(0, 5),
    overdueProjects: overdue.slice(0, 5),
    targetProgress,
    followUpsDueToday,
    overdueFollowUps,
    upcomingFollowUps,
  }
}
