export interface Project {
  id: string
  created_at: string
  updated_at: string
  user_id: string
  name: string
  description: string | null
  status: string
  client_name: string | null
  client_id: string | null
  start_date: string | null
  end_date: string | null
  budget: number | null
  project_type: string | null
  location: string | null
  location_url: string | null
  expected_timeline: string | null
  expected_payment_date: string | null
  revision_count: number | null
}

export type ProjectFormData = {
  name: string
  description: string
  status: string
  client_name: string
  client_id: string
  start_date: string
  end_date: string
  budget: string
  project_type: string
  location: string
  location_url: string
  expected_timeline: string
  expected_payment_date: string
  revision_count: string
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
  notes: string | null
  address: string | null
  source: string | null
}

export const CLIENT_SOURCES = ['Referral', 'Instagram', 'Website', 'Walk-in', 'Other'] as const

export type ClientFormData = {
  name: string
  email: string
  phone: string
  company: string
  address: string
  source: string
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
  method: string
  status: string
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
  type: 'start' | 'due' | 'site_visit'
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

export type FollowUpStatus = 'pending' | 'contacted' | 'waiting_client' | 'closed'

export interface FollowUp {
  id: string
  created_at: string
  updated_at: string
  user_id: string
  client_id: string
  next_follow_up_date: string | null
  last_follow_up_date: string | null
  notes: string | null
  status: FollowUpStatus
}

export type FollowUpFormData = {
  client_id: string
  next_follow_up_date: string
  last_follow_up_date: string
  notes: string
  status: FollowUpStatus
}

export interface FollowUpWithClient extends FollowUp {
  client_name: string
  client_whatsapp: string | null
}

export type SiteVisitStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'

export interface SiteVisit {
  id: string
  created_at: string
  updated_at: string
  user_id: string
  project_id: string | null
  client_id: string | null
  visit_date: string
  location: string | null
  notes: string | null
  travel_cost: number
  site_status: SiteVisitStatus
  next_action: string | null
  photo_urls: string[]
  latitude: number | null
  longitude: number | null
}

export type SiteVisitFormData = {
  project_id: string
  client_id: string
  visit_date: string
  location: string
  notes: string
  travel_cost: string
  site_status: SiteVisitStatus
  next_action: string
  latitude: string
  longitude: string
}

export interface SiteVisitWithRelations extends SiteVisit {
  project_name: string | null
  client_name: string | null
}

export type ProposalTemplate = 'architecture' | '3d_elevation' | 'interior' | 'consultation'

export type ProposalStatus = 'draft' | 'sent' | 'accepted' | 'rejected'

export interface Proposal {
  id: string
  created_at: string
  updated_at: string
  user_id: string
  client_id: string
  project_id: string | null
  template: ProposalTemplate
  proposal_number: string
  fee_amount: number
  scope_of_work: string
  deliverables: string
  timeline: string
  terms_conditions: string
  status: ProposalStatus
}

export type ProposalFormData = {
  client_id: string
  project_id: string
  template: ProposalTemplate
  fee_amount: string
  scope_of_work: string
  deliverables: string
  timeline: string
  terms_conditions: string
}

export interface ProposalWithRelations extends Proposal {
  client_name: string
  project_name: string | null
}

export const TEMPLATE_LABELS: Record<ProposalTemplate, string> = {
  architecture: 'Architecture Design Proposal',
  '3d_elevation': '3D Elevation Proposal',
  interior: 'Interior Design Proposal',
  consultation: 'Consultation Proposal',
}

export type WhatsAppTemplate = 'payment_reminder' | 'project_update' | 'meeting_reminder' | 'custom'

export const WHATSAPP_TEMPLATES: Record<WhatsAppTemplate, (clientName: string) => string> = {
  payment_reminder: (name) =>
    `Dear ${name}, this is a friendly reminder about your pending payment. Please contact us at your earliest convenience. Thank you, Proline Architects & Builders.`,
  project_update: (name) =>
    `Dear ${name}, here is an update on your project. Please contact us for more details. Thank you, Proline Architects & Builders.`,
  meeting_reminder: (name) =>
    `Dear ${name}, this is a reminder about our scheduled meeting. Please confirm your availability. Thank you, Proline Architects & Builders.`,
  custom: () => '',
}

export interface AnalyticsData {
  totalRevenue: number
  totalExpenses: number
  netProfit: number
  outstandingBalance: number
  averageProjectValue: number
  collectionRate: number

  monthlyRevenue: { month: string; revenue: number }[]
  monthlyExpenses: { month: string; expenses: number }[]
  monthlyProfit: { month: string; profit: number }[]

  projectStatusDistribution: { name: string; value: number }[]
  revenueByClient: { client: string; revenue: number }[]
  revenueByProjectStatus: { status: string; revenue: number }[]

  topClient: { name: string; revenue: number } | null
  topProjectStatus: { status: string; revenue: number } | null
  overdueProjectsCount: number
  pendingCollectionAmount: number
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
  followUpsDueToday: number
  overdueFollowUps: Pick<FollowUp, 'id' | 'client_id' | 'next_follow_up_date' | 'status' | 'notes'>[]
  upcomingFollowUps: Pick<FollowUp, 'id' | 'client_id' | 'next_follow_up_date' | 'status' | 'notes'>[]
  siteVisitsThisMonth: number
  upcomingSiteVisits: Pick<SiteVisit, 'id' | 'visit_date' | 'location' | 'site_status'>[]
}
