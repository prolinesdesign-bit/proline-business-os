import { useEffect, useState, useCallback } from 'react'
import type { Payment, PaymentFormData, ProjectPaymentSummary, Project } from '../types'
import { getPayments, getProjectSummaries, createPayment, updatePayment, deletePayment } from '../lib/api/payments'
import { getProjects } from '../lib/api/projects'
import PaymentForm from '../components/payments/PaymentForm'
import AppLayout from '../components/layout/AppLayout'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table'
import { toast } from 'sonner'
import { TableSkeleton } from '../components/ui/Skeleton'
import { EmptyState } from '../components/ui/EmptyState'

export default function Payments() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [summaries, setSummaries] = useState<ProjectPaymentSummary[]>([])
  const [projects, setProjects] = useState<Pick<Project, 'id' | 'name'>[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Payment | null>(null)
  const [deleting, setDeleting] = useState<Payment | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const [p, s, pr] = await Promise.all([
        getPayments(),
        getProjectSummaries(),
        getProjects(''),
      ])
      setPayments(p)
      setSummaries(s)
      setProjects(pr)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  async function handleSave(data: PaymentFormData) {
    try {
      if (editing) {
        await updatePayment(editing.id, data)
      } else {
        await createPayment(data)
      }
      toast.success('Payment saved')
      setShowForm(false)
      setEditing(null)
      fetch()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  async function handleDelete() {
    if (!deleting) return
    try {
      await deletePayment(deleting.id)
      toast.success('Payment deleted')
      setDeleting(null)
      fetch()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const totalOutstanding = summaries.reduce((sum, s) => sum + s.balance_due, 0)

  return (
    <AppLayout>
      <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Payments</h1>
        <Button onClick={() => setShowForm(true)}>
          + Add Payment
        </Button>
      </div>

      {/* Project payment summary cards */}
      {summaries.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-3 text-lg font-semibold">Project Payment Summary</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {summaries.map(s => (
              <Card key={s.project_id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <h3 className="truncate text-sm font-semibold text-foreground">{s.project_name}</h3>
                  <div className="mt-2 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Project Value</span>
                      <span className="font-medium">₹{s.project_value.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Paid</span>
                      <span className="font-medium text-green-600">₹{s.total_paid.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-t pt-1">
                      <span className="text-muted-foreground">Balance Due</span>
                      <span className={`font-semibold ${s.balance_due > 0 ? 'text-destructive' : 'text-green-600'}`}>
                        ₹{s.balance_due.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-3 text-right text-sm text-muted-foreground">
            Total Outstanding: <span className="font-semibold text-destructive">₹{totalOutstanding.toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Payments list */}
      <div className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">All Payments</h2>

        {loading ? (
          <TableSkeleton />
        ) : payments.length === 0 ? (
          <EmptyState title="No payments yet" description="Click + Add Payment to record one." />
        ) : (
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map(p => {
                  const project = projects.find(pr => pr.id === p.project_id)
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="whitespace-nowrap">{p.payment_date}</TableCell>
                      <TableCell className="whitespace-nowrap">{project?.name ?? '—'}</TableCell>
                      <TableCell className="whitespace-nowrap font-medium">₹{Number(p.amount).toLocaleString()}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-muted-foreground">{p.description ?? '—'}</TableCell>
                      <TableCell className="whitespace-nowrap text-right">
                        <Button variant="link" size="sm" onClick={() => { setEditing(p); setShowForm(true) }}>Edit</Button>
                        <Button variant="link" size="sm" className="ml-3 text-destructive" onClick={() => setDeleting(p)}>Delete</Button>
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
        {payments.map((payment) => {
          const project = projects.find(pr => pr.id === payment.project_id)
          return (
            <Card key={payment.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">{project?.name ?? 'Unknown Project'}</p>
                    <p className="text-xs text-muted-foreground">{payment.payment_date}</p>
                    {payment.description && <p className="mt-1 text-xs text-muted-foreground truncate">{payment.description}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1 ml-3">
                    <span className="font-semibold text-foreground">₹{Number(payment.amount).toLocaleString()}</span>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditing(payment); setShowForm(true) }} className="text-xs text-blue-600 hover:underline">Edit</button>
                      <button onClick={() => setDeleting(payment)} className="text-xs text-red-600 hover:underline">Del</button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {showForm && (
        <PaymentForm
          projects={projects}
          payment={editing}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditing(null) }}
        />
      )}

      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-sm">
            <CardHeader>
              <CardTitle>Delete Payment</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Delete ₹{Number(deleting.amount).toLocaleString()} payment? This cannot be undone.
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
