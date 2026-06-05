import { supabase } from '../supabase'
import type { Expense, ExpenseFormData, ExpenseSummary } from '../../types'
import { CATEGORY_TO_DB, DB_TO_CATEGORY } from '../../types'

function toDb(category: string): string {
  return CATEGORY_TO_DB[category] ?? category.toLowerCase()
}

function toDisplay(category: string): string {
  return DB_TO_CATEGORY[category] ?? category
}

export async function getExpenses(search: string): Promise<Expense[]> {
  let query = supabase
    .from('expenses')
    .select('*')
    .order('expense_date', { ascending: false })

  if (search) {
    query = query.or(
      `category.ilike.%${search}%,description.ilike.%${search}%`,
    )
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []).map(e => ({ ...e, category: toDisplay(e.category) }))
}

export async function getExpenseSummary(): Promise<ExpenseSummary> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const monthStr = `${year}-${String(month).padStart(2, '0')}`

  const { data, error } = await supabase
    .from('expenses')
    .select('amount, expense_date, category')
    .eq('user_id', user.id)

  if (error) throw error

  const all = data ?? []

  let monthTotal = 0
  let yearTotal = 0
  const byCategory = new Map<string, number>()

  for (const e of all) {
    const date = e.expense_date?.slice(0, 7)
    const yearOnly = e.expense_date?.slice(0, 4)

    if (date === monthStr) monthTotal += Number(e.amount)
    if (yearOnly === String(year)) yearTotal += Number(e.amount)

    const cat = toDisplay(e.category || 'other')
    byCategory.set(cat, (byCategory.get(cat) ?? 0) + Number(e.amount))
  }

  return {
    month_total: monthTotal,
    year_total: yearTotal,
    by_category: Array.from(byCategory.entries())
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total),
  }
}

export async function createExpense(data: ExpenseFormData): Promise<Expense> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: expense, error } = await supabase
    .from('expenses')
    .insert({
      user_id: user.id,
      project_id: data.project_id || null,
      amount: Number(data.amount),
      expense_date: data.expense_date,
      category: toDb(data.category),
      description: data.description || null,
    })
    .select()
    .single()

  if (error) throw error
  return { ...expense, category: toDisplay(expense.category) }
}

export async function updateExpense(id: string, data: ExpenseFormData): Promise<Expense> {
  const { data: expense, error } = await supabase
    .from('expenses')
    .update({
      project_id: data.project_id || null,
      amount: Number(data.amount),
      expense_date: data.expense_date,
      category: toDb(data.category),
      description: data.description || null,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return { ...expense, category: toDisplay(expense.category) }
}

export async function deleteExpense(id: string): Promise<void> {
  const { error } = await supabase.from('expenses').delete().eq('id', id)
  if (error) throw error
}
