import { supabase } from '../supabase'
import type { AnalyticsData } from '../../types'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function startOfYear() {
  const d = new Date()
  d.setMonth(0, 1)
  d.setHours(0, 0, 0, 0)
  return d
}

export async function getAnalyticsData(): Promise<AnalyticsData> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const now = new Date()
  const yearStart = startOfYear()
  const yearEnd = new Date(yearStart.getFullYear() + 1, 0, 1)

  const [projectsRes, paymentsRes, expensesRes] = await Promise.all([
    supabase
      .from('projects')
      .select('id, name, status, budget, end_date, client_name, client_id'),
    supabase
      .from('payments')
      .select('id, amount, payment_date, client_id, project_id')
      .eq('status', 'completed'),
    supabase
      .from('expenses')
      .select('id, amount, expense_date'),
  ])

  if (projectsRes.error) throw projectsRes.error
  if (paymentsRes.error) throw paymentsRes.error
  if (expensesRes.error) throw expensesRes.error

  const projects = projectsRes.data ?? []
  const payments = paymentsRes.data ?? []
  const expenses = expensesRes.data ?? []

  // -- Metrics --
  const totalRevenue = payments.reduce((s, p) => s + Number(p.amount), 0)
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0)
  const netProfit = totalRevenue - totalExpenses
  const totalProjectValue = projects.reduce((s, p) => s + Number(p.budget ?? 0), 0)
  const outstandingBalance = totalProjectValue - totalRevenue
  const totalProjects = projects.length
  const averageProjectValue = totalProjects > 0 ? totalProjectValue / totalProjects : 0
  const collectionRate = totalProjectValue > 0 ? (totalRevenue / totalProjectValue) * 100 : 0

  // -- Monthly charts (current year) --
  const monthlyRevenue = new Array(12).fill(0)
  for (const p of payments) {
    const d = new Date(p.payment_date)
    if (d >= yearStart && d < yearEnd) {
      monthlyRevenue[d.getMonth()] += Number(p.amount)
    }
  }

  const monthlyExpArr = new Array(12).fill(0)
  for (const e of expenses) {
    const d = new Date(e.expense_date)
    if (d >= yearStart && d < yearEnd) {
      monthlyExpArr[d.getMonth()] += Number(e.amount)
    }
  }

  const monthlyRevenueData = monthlyRevenue.map((v, i) => ({ month: MONTHS[i], revenue: Math.round(v * 100) / 100 }))
  const monthlyExpensesData = monthlyExpArr.map((v, i) => ({ month: MONTHS[i], expenses: Math.round(v * 100) / 100 }))
  const monthlyProfitData = monthlyRevenue.map((v, i) => ({
    month: MONTHS[i],
    profit: Math.round((v - monthlyExpArr[i]) * 100) / 100,
  }))

  // -- Project Status Distribution --
  const statusCounts: Record<string, number> = {}
  for (const p of projects) {
    statusCounts[p.status] = (statusCounts[p.status] ?? 0) + 1
  }
  const projectStatusDistribution = Object.entries(statusCounts).map(([name, value]) => ({ name, value }))

  // -- Revenue by Client --
  // Group payments by client_name (via project lookup)
  const projectClientMap = new Map<string, string>()
  for (const p of projects) {
    if (p.client_name) projectClientMap.set(p.id, p.client_name)
  }
  const clientRevenue: Record<string, number> = {}
  for (const pay of payments) {
    const client = pay.client_id
      ? (projects.find(pj => pj.id === pay.project_id)?.client_name ?? 'Unknown')
      : projectClientMap.get(pay.project_id ?? '') ?? 'Unknown'
    clientRevenue[client] = (clientRevenue[client] ?? 0) + Number(pay.amount)
  }
  const revenueByClient = Object.entries(clientRevenue)
    .map(([client, revenue]) => ({ client, revenue: Math.round(revenue * 100) / 100 }))
    .sort((a, b) => b.revenue - a.revenue)

  // -- Revenue by Project Status --
  const paymentByProject = new Map<string, number>()
  for (const pay of payments) {
    if (!pay.project_id) continue
    paymentByProject.set(pay.project_id, (paymentByProject.get(pay.project_id) ?? 0) + Number(pay.amount))
  }
  const statusRevenue: Record<string, number> = {}
  for (const p of projects) {
    const rev = paymentByProject.get(p.id) ?? 0
    statusRevenue[p.status] = (statusRevenue[p.status] ?? 0) + rev
  }
  const revenueByProjectStatus = Object.entries(statusRevenue)
    .map(([status, revenue]) => ({ status, revenue: Math.round(revenue * 100) / 100 }))
    .sort((a, b) => b.revenue - a.revenue)

  // -- Insights --
  const topClient = revenueByClient.length > 0 ? { name: revenueByClient[0].client, revenue: revenueByClient[0].revenue } : null
  const topProjectStatus = revenueByProjectStatus.length > 0 ? revenueByProjectStatus[0] : null

  const overdueProjectsCount = projects.filter(p => {
    if (!p.end_date) return false
    return p.status !== 'completed' && p.status !== 'cancelled' && new Date(p.end_date) < now
  }).length

  const pendingCollectionAmount = outstandingBalance

  return {
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalExpenses: Math.round(totalExpenses * 100) / 100,
    netProfit: Math.round(netProfit * 100) / 100,
    outstandingBalance: Math.round(outstandingBalance * 100) / 100,
    averageProjectValue: Math.round(averageProjectValue * 100) / 100,
    collectionRate: Math.round(collectionRate * 100) / 100,
    monthlyRevenue: monthlyRevenueData,
    monthlyExpenses: monthlyExpensesData,
    monthlyProfit: monthlyProfitData,
    projectStatusDistribution,
    revenueByClient,
    revenueByProjectStatus,
    topClient,
    topProjectStatus,
    overdueProjectsCount,
    pendingCollectionAmount: Math.round(pendingCollectionAmount * 100) / 100,
  }
}
