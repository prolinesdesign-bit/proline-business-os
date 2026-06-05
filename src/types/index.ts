export interface Project {
  id: string
  created_at: string
  updated_at: string
  user_id: string
  name: string
  description: string | null
  status: 'active' | 'completed' | 'on_hold' | 'cancelled'
  client_name: string | null
  client_id: string | null
  start_date: string | null
  end_date: string | null
  budget: number | null
}

export type ProjectFormData = {
  name: string
  description: string
  status: Project['status']
  client_name: string
  start_date: string
  end_date: string
  budget: string
}

export interface Client {
  id: string
  created_at: string
  updated_at: string
  user_id: string
  name: string
  email: string | null
  phone: string | null
  company: string | null
  whatsapp: string | null
  notes: string | null
}

export type ClientFormData = {
  name: string
  email: string
  phone: string
  location: string
  whatsapp: string
  notes: string
}

export interface ClientStats {
  project_count: number
  total_value: number
}

export interface Payment {
  id: string
  created_at: string
  updated_at: string
  user_id: string
  client_id: string
  project_id: string | null
  amount: number
  currency: string
  payment_date: string
  method: 'credit_card' | 'bank_transfer' | 'cash' | 'paypal' | 'stripe' | 'other'
  status: 'pending' | 'completed' | 'refunded' | 'failed'
  description: string | null
}

export type PaymentFormData = {
  project_id: string
  amount: string
  payment_date: string
  description: string
}

export interface ProjectPaymentSummary {
  project_id: string
  project_name: string
  project_value: number
  total_paid: number
  balance_due: number
}

export const EXPENSE_CATEGORIES = [
  'Software',
  'Internet',
  'Travel',
  'Site Visit',
  'Printing',
  'Marketing',
  'Salary',
  'Freelancers',
  'Miscellaneous',
] as const

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]

export const CATEGORY_TO_DB: Record<string, string> = {
  Software: 'software',
  Internet: 'utilities',
  Travel: 'travel',
  'Site Visit': 'other',
  Printing: 'materials',
  Marketing: 'other',
  Salary: 'contractor',
  Freelancers: 'contractor',
  Miscellaneous: 'other',
}

export const DB_TO_CATEGORY: Record<string, string> = {
  software: 'Software',
  utilities: 'Internet',
  travel: 'Travel',
  other: 'Miscellaneous',
  materials: 'Printing',
  contractor: 'Freelancers',
}

export interface Expense {
  id: string
  created_at: string
  updated_at: string
  user_id: string
  project_id: string | null
  amount: number
  currency: string
  expense_date: string
  category: string
  description: string | null
  receipt_url: string | null
}

export type ExpenseFormData = {
  project_id: string
  amount: string
  expense_date: string
  category: string
  description: string
}

export interface ExpenseSummary {
  month_total: number
  year_total: number
  by_category: { category: string; total: number }[]
}

export interface Target {
  id: string
  created_at: string
  updated_at: string
  user_id: string
  title: string
  description: string | null
  target_type: 'revenue' | 'leads' | 'projects' | 'custom'
  target_value: number
  current_value: number
  start_date: string
  end_date: string
  status: 'active' | 'achieved' | 'missed'
}

export type TargetFormData = {
  title: string
  target_value: string
  start_date: string
  end_date: string
}

export interface TargetProgress {
  target: Target | null
  currentRevenue: number
  remaining: number
  percentage: number
  dailyNeeded: number
}

export interface CalendarDay {
  date: Date
  day: number
  isCurrentMonth: boolean
  isToday: boolean
  isThisWeek: boolean
  events: CalendarEvent[]
}

export interface CalendarEvent {
  id: string
  name: string
  client_name: string | null
  status: string
  type: 'start' | 'due'
  date: string
}

export interface Task {
  id: string
  created_at: string
  updated_at: string
  user_id: string
  title: string
  description: string | null
  status: 'todo' | 'in_progress' | 'done' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  due_date: string | null
  project_id: string | null
}

export type TaskFormData = {
  title: string
  description: string
  priority: Task['priority']
  due_date: string
  project_id: string
}

export interface TaskWithProject extends Task {
  project_name?: string | null
}

export interface Document {
  id: string
  created_at: string
  updated_at: string
  user_id: string
  project_id: string | null
  name: string
  file_type: string
  file_size: number
  storage_path: string
  notes: string | null
}

export interface ProjectDocumentCount {
  project_id: string
  count: number
}

export interface DashboardData {
  totalProjects: number
  activeProjects: number
  totalProjectValue: number
  totalPaid: number
  outstandingBalance: number
  totalExpenses: number
  netProfit: number
  projectsDueThisWeek: number
  monthlyRevenue: { month: string; revenue: number }[]
  monthlyExpenses: { month: string; expenses: number }[]
  monthlyProfit: { month: string; profit: number }[]
  recentProjects: Pick<Project, 'id' | 'name' | 'status' | 'budget' | 'end_date' | 'client_name'>[]
  recentPayments: Pick<Payment, 'id' | 'amount' | 'payment_date' | 'description' | 'project_id'>[]
  recentExpenses: Pick<Expense, 'id' | 'amount' | 'expense_date' | 'category' | 'description' | 'project_id'>[]
  upcomingDueDates: Pick<Project, 'id' | 'name' | 'end_date' | 'client_name'>[]
  overdueProjects: Pick<Project, 'id' | 'name' | 'status' | 'end_date' | 'client_name'>[]
  targetProgress: TargetProgress | null
}
