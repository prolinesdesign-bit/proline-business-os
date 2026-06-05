import { supabase } from '../supabase'
import type { DashboardData } from '../../types'

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

export async function getDashboardData(): Promise<DashboardData> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const [projectsRes, paymentsRes, expensesRes] = await Promise.all([
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
  ])

  if (projectsRes.error) throw projectsRes.error
  if (paymentsRes.error) throw paymentsRes.error
  if (expensesRes.error) throw expensesRes.error

  const projects = projectsRes.data ?? []
  const payments = paymentsRes.data ?? []
  const expenses = expensesRes.data ?? []

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

  // Recent items (sorted by end_date descending for projects, payment_date for payments, expense_date for expenses)
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

  // Projects with upcoming end dates (nearest future first)
  const now = new Date()
  const upcoming = [...projects]
    .filter(p => p.end_date && new Date(p.end_date) >= now)
    .sort((a, b) => new Date(a.end_date!).getTime() - new Date(b.end_date!).getTime())

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
  }
}
