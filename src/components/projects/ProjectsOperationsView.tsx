import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Project } from '../../types'
import type { ProjectPaymentSummary } from '../../types'
import { updateProject } from '../../lib/api/projects'
import { Button } from '../ui/Button'
import { Select } from '../ui/Select'
import { Card, CardContent } from '../ui/Card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../ui/Table'
import { toast } from 'sonner'

interface Props {
  projects: Project[]
  paymentSummaries: ProjectPaymentSummary[]
  clientWhatsapp: Record<string, string>
  onEdit: (project: Project) => void
  onDelete: (project: Project) => void
  onWhatsApp: (phone: string, name: string) => void
}

const STAGES = [
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'cancelled', label: 'Cancelled' },
]

function formatCurrency(n: number): string {
  return `₹${n.toLocaleString()}`
}

export default function ProjectsOperationsView({
  projects, paymentSummaries, clientWhatsapp,
  onEdit, onDelete, onWhatsApp,
}: Props) {
  const [updating, setUpdating] = useState<Record<string, boolean>>({})

  async function handleStageChange(projectId: string, status: string) {
    setUpdating(prev => ({ ...prev, [projectId]: true }))
    try {
      const project = projects.find(p => p.id === projectId)
      if (!project) return
      await updateProject(projectId, {
        name: project.name,
        description: project.description ?? '',
        status: status as Project['status'],
        client_name: project.client_name ?? '',
        start_date: project.start_date ?? '',
        end_date: project.end_date ?? '',
        budget: project.budget?.toString() ?? '',
      })
      toast.success('Stage updated')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setUpdating(prev => ({ ...prev, [projectId]: false }))
    }
  }

  const totalAmount = projects.reduce((sum, p) => sum + (p.budget ?? 0), 0)
  const totalPaid = projects.reduce((sum, p) => {
    const s = paymentSummaries.find(x => x.project_id === p.id)
    return sum + (s?.total_paid ?? 0)
  }, 0)
  const totalBalance = totalAmount - totalPaid

  // Collect client WhatsApp phone numbers
  const clientPhones: Record<string, { phone: string; name: string }> = {}
  for (const p of projects) {
    if (!p.client_id) continue
    const wp = clientWhatsapp[p.client_id]
    if (wp) {
      clientPhones[p.client_id] = { phone: wp, name: p.client_name ?? p.name }
    }
  }

  return (
    <>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px]">Project</TableHead>
              <TableHead className="w-[140px]">Client</TableHead>
              <TableHead className="w-[110px]">WhatsApp</TableHead>
              <TableHead className="w-[100px]">Stage</TableHead>
              <TableHead className="w-[100px] text-right">Amount</TableHead>
              <TableHead className="w-[90px] text-right">Paid</TableHead>
              <TableHead className="w-[100px] text-right">Balance</TableHead>
              <TableHead className="w-[140px]">Timeline</TableHead>
              <TableHead className="min-w-[120px]">Notes</TableHead>
              <TableHead className="w-[70px] text-right" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map(p => {
              const summary = paymentSummaries.find(s => s.project_id === p.id)
              return (
                <TableRow key={p.id} className="group">
                  <TableCell>
                    <Link to={`/project/${p.id}`} className="truncate font-medium text-sm text-blue-600 hover:underline block">
                      {p.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {p.client_id ? (
                      <Link to={`/client/${p.client_id}`} className="truncate text-xs text-muted-foreground hover:text-blue-500 block">
                        {p.client_name ?? 'Unknown'}
                      </Link>
                    ) : (
                      <span className="text-xs text-muted-foreground">{p.client_name ?? '-'}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {p.client_id && clientPhones[p.client_id!] ? (
                      <Button
                        variant="success"
                        size="sm"
                        className="h-6 text-[10px] px-1.5"
                        onClick={() => onWhatsApp(clientPhones[p.client_id!].phone, clientPhones[p.client_id!].name)}
                        title={`WhatsApp ${clientPhones[p.client_id!].name}`}
                      >
                        {clientPhones[p.client_id!].phone.replace(/\D/g, '').slice(-10)}
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={p.status}
                      onChange={e => handleStageChange(p.id, e.target.value)}
                      className="h-7 text-xs"
                      disabled={updating[p.id]}
                    >
                      {STAGES.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </Select>
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs">
                    {p.budget != null ? formatCurrency(Number(p.budget)) : '-'}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs">
                    {summary != null ? formatCurrency(summary.total_paid) : '₹0'}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs font-semibold">
                    {summary != null
                      ? formatCurrency(summary.balance_due)
                      : p.budget != null ? formatCurrency(Number(p.budget)) : '-'}
                  </TableCell>
                  <TableCell className="text-xs whitespace-nowrap">
                    {p.start_date || p.end_date ? (
                      <span className="text-muted-foreground">
                        {p.start_date ?? '…'} → {p.end_date ?? '…'}
                      </span>
                    ) : '-'}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[120px]">
                    <span className="truncate block" title={p.description ?? ''}>
                      {p.description ? p.description.length > 50 ? p.description.slice(0, 50) + '…' : p.description : '-'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-0.5">
                      <Button
                        variant="link"
                        size="sm"
                        className="h-6 text-xs px-1"
                        onClick={() => onEdit(p)}
                        title="Edit project"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="link"
                        size="sm"
                        className="h-6 text-xs px-1 text-destructive"
                        onClick={() => onDelete(p)}
                        title="Delete project"
                      >
                        Del
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
          {/* Summary footer row */}
          <tfoot>
            <TableRow className="border-t-2 border-gray-300 bg-gray-50 font-semibold">
              <TableCell colSpan={4} className="text-xs font-semibold">
                {projects.length} project{projects.length !== 1 ? 's' : ''}
              </TableCell>
              <TableCell className="text-right font-mono text-xs font-bold">
                {formatCurrency(totalAmount)}
              </TableCell>
              <TableCell className="text-right font-mono text-xs font-bold">
                {formatCurrency(totalPaid)}
              </TableCell>
              <TableCell className={`text-right font-mono text-xs font-bold ${totalBalance > 0 ? 'text-destructive' : 'text-green-600'}`}>
                {formatCurrency(totalBalance)}
              </TableCell>
              <TableCell colSpan={3} />
            </TableRow>
          </tfoot>
        </Table>
      </div>

      <div className="space-y-2 md:hidden">
        {projects.map(p => {
          const summary = paymentSummaries.find(s => s.project_id === p.id)
          const wp = p.client_id ? clientWhatsapp[p.client_id] : undefined
          return (
            <Card key={p.id}>
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Link to={`/project/${p.id}`} className="truncate text-sm font-semibold text-blue-600 hover:underline">
                        {p.name}
                      </Link>
                    </div>
                    {p.client_name && (
                      <Link to={`/client/${p.client_id}`} className="truncate text-xs text-muted-foreground hover:text-blue-500 block">
                        {p.client_name}
                      </Link>
                    )}
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                      <Select
                        value={p.status}
                        onChange={e => handleStageChange(p.id, e.target.value)}
                        className="h-6 text-[10px] w-24"
                        disabled={updating[p.id]}
                      >
                        {STAGES.map(s => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </Select>
                      <span className="font-mono">{p.budget != null ? formatCurrency(Number(p.budget)) : '-'}</span>
                      <span className="text-muted-foreground">Paid: {summary != null ? formatCurrency(summary.total_paid) : '₹0'}</span>
                      <span className="font-semibold">{summary != null ? formatCurrency(summary.balance_due) : '-'}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      {p.start_date || p.end_date ? (
                        <span>{p.start_date ?? '…'} → {p.end_date ?? '…'}</span>
                      ) : null}
                    </div>
                    {p.description && (
                      <p className="mt-1 text-xs text-muted-foreground truncate">{p.description}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex gap-1">
                      <Button variant="link" size="sm" className="h-6 text-xs px-1" onClick={() => onEdit(p)}>Edit</Button>
                      <Button variant="link" size="sm" className="h-6 text-xs px-1 text-destructive" onClick={() => onDelete(p)}>Del</Button>
                    </div>
                    {wp && (
                      <Button
                        variant="success"
                        size="sm"
                        className="h-6 text-[10px]"
                        onClick={() => onWhatsApp(wp, p.client_name ?? p.name)}
                      >
                        WhatsApp
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
        {/* Mobile summary */}
        <Card className="border-2 border-gray-300">
          <CardContent className="p-3">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span>{projects.length} project{projects.length !== 1 ? 's' : ''}</span>
              <span className="font-mono">Total: {formatCurrency(totalAmount)}</span>
              <span className="font-mono">Paid: {formatCurrency(totalPaid)}</span>
              <span className={`font-mono ${totalBalance > 0 ? 'text-destructive' : 'text-green-600'}`}>
                Balance: {formatCurrency(totalBalance)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
