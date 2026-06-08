import { useEffect, useState, useCallback } from 'react'
import type { Expense, ExpenseFormData, ExpenseSummary, Project } from '../types'
import {
  getExpenses,
  getExpenseSummary,
  createExpense,
  updateExpense,
  deleteExpense,
} from '../lib/api/expenses'
import { getProjects } from '../lib/api/projects'
import ExpenseForm from '../components/expenses/ExpenseForm'
import AppLayout from '../components/layout/AppLayout'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table'
import { toast } from 'sonner'
import { TableSkeleton, CardSkeleton } from '../components/ui/Skeleton'
import { EmptyState } from '../components/ui/EmptyState'

export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [summary, setSummary] = useState<ExpenseSummary | null>(null)
  const [projects, setProjects] = useState<Pick<Project, 'id' | 'name'>[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Expense | null>(null)
  const [deleting, setDeleting] = useState<Expense | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const [e, s, pr] = await Promise.all([
        getExpenses(search),
        getExpenseSummary(),
        getProjects(''),
      ])
      setExpenses(e)
      setSummary(s)
      setProjects(pr)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => { fetch() }, [fetch])

  async function handleSave(data: ExpenseFormData) {
    try {
      if (editing) {
        await updateExpense(editing.id, data)
      } else {
        await createExpense(data)
      }
      toast.success('Expense saved')
      setShowForm(false)
      setEditing(null)
      fetch()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save expense')
    }
  }

  async function handleDelete() {
    if (!deleting) return
    try {
      await deleteExpense(deleting.id)
      toast.success('Expense deleted')
      setDeleting(null)
      fetch()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete expense')
    }
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-3xl tracking-tight">Expenses</h1>
        <Button onClick={() => setShowForm(true)}>
          + Add Expense
        </Button>
      </div>

      {/* Summary cards */}
      {loading ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <CardSkeleton /><CardSkeleton /><CardSkeleton />
        </div>
      ) : summary && (
        <div className="mt-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">This Month</p>
                <p className="mt-1 text-2xl font-bold text-primary">₹{summary.month_total.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">This Year</p>
                <p className="mt-1 text-2xl font-bold text-success">₹{summary.year_total.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Categories</p>
                <div className="mt-2 space-y-1">
                  {summary.by_category.slice(0, 5).map(c => (
                    <div key={c.category} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{c.category}</span>
                      <span className="font-medium">₹{c.total.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Search */}
      <Input
        type="text"
        placeholder="Search expenses..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="mt-6 w-full"
      />

      {/* Expenses list */}
      <div className="mt-6">
        {loading ? (
          <TableSkeleton />
        ) : expenses.length === 0 ? (
          <div className="mt-8">
            {search ? (
              <EmptyState title="No results" description="No expenses match your search." />
            ) : (
              <EmptyState title="No expenses yet" description="Click + Add Expense to record one." />
            )}
          </div>
        ) : (
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map(e => {
                  const project = projects.find(p => p.id === e.project_id)
                  return (
                    <TableRow key={e.id}>
                      <TableCell className="whitespace-nowrap">{e.expense_date}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge variant="secondary">{e.category}</Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap font-medium">₹{Number(e.amount).toLocaleString()}</TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">{project?.name ?? '—'}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-muted-foreground">{e.description ?? '—'}</TableCell>
                      <TableCell className="whitespace-nowrap text-right">
                        <Button variant="link" size="sm" onClick={() => { setEditing(e); setShowForm(true) }}>Edit</Button>
                        <Button variant="link" size="sm" className="ml-3 text-destructive" onClick={() => setDeleting(e)}>Delete</Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Mobile card view */}
      <div className="space-y-3 md:hidden">
        {expenses.map((expense) => {
          const project = projects.find(p => p.id === expense.project_id)
          return (
            <Card key={expense.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">₹{Number(expense.amount).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{expense.expense_date}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      <Badge variant="secondary">{expense.category}</Badge>
                      {project && <span className="text-xs text-muted-foreground">{project.name}</span>}
                    </div>
                    {expense.description && <p className="mt-1 text-xs text-muted-foreground truncate">{expense.description}</p>}
                  </div>
                  <div className="flex gap-1 ml-3">
                    <button onClick={() => { setEditing(expense); setShowForm(true) }} className="text-xs text-primary hover:underline">Edit</button>
                    <button onClick={() => setDeleting(expense)} className="text-xs text-destructive hover:underline">Del</button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {showForm && (
        <ExpenseForm
          expense={editing}
          projects={projects}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditing(null) }}
        />
      )}

      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-sm">
            <CardHeader>
              <CardTitle>Delete Expense</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Delete ₹{Number(deleting.amount).toLocaleString()} expense? This cannot be undone.
              </p>
              <div className="mt-5 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button>
                <Button variant="destructive" onClick={handleDelete}>Delete</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
    </AppLayout>
  )
}
