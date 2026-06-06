import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Project } from '../../types'
import type { ProjectPaymentSummary } from '../../types'
import { supabase } from '../../lib/supabase'
import { updateProject } from '../../lib/api/projects'
import { createPayment } from '../../lib/api/payments'
import { generateWhatsAppUrl } from '../../lib/api/followups'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
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
  onUpdate: (project: Project) => void
  onRefresh: () => void
}

const STAGES = [
  { value: 'lead', label: 'Lead' },
  { value: 'communicated', label: 'Communicated' },
  { value: 'advance_paid', label: 'Advance Paid' },
  { value: 'prelim_model', label: 'Prelim Model' },
  { value: 'discussed', label: 'Discussed' },
  { value: 'final_render', label: 'Final Render' },
  { value: 'balance_paid', label: 'Balance Paid' },
  { value: 'delivered', label: 'Delivered' },
]

function formatCurrency(n: number): string {
  return `₹${n.toLocaleString()}`
}

function daysSince(dateStr: string): number | null {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return null
  const diff = Date.now() - d.getTime()
  return Math.floor(diff / 86400000)
}

function daysUntil(dateStr: string): number | null {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return null
  const diff = d.getTime() - Date.now()
  return Math.ceil(diff / 86400000)
}

export default function ProjectsOperationsView({
  projects, paymentSummaries, clientWhatsapp,
  onEdit, onDelete, onUpdate, onRefresh,
}: Props) {
  const [updating, setUpdating] = useState<Record<string, boolean>>({})
  const [editValues, setEditValues] = useState<Record<string, Record<string, string>>>({})

  function getEdit(projectId: string, field: string): string {
    return editValues[projectId]?.[field] ?? ''
  }

  function setEdit(projectId: string, field: string, value: string) {
    setEditValues(prev => ({
      ...prev,
      [projectId]: { ...(prev[projectId] ?? {}), [field]: value },
    }))
  }

  function clearEdit(projectId: string) {
    setEditValues(prev => {
      const next = { ...prev }
      delete next[projectId]
      return next
    })
  }

  async function saveProject(projectId: string, overrides: Record<string, string>) {
    const project = projects.find(p => p.id === projectId)
    if (!project) return null
    setUpdating(prev => ({ ...prev, [projectId]: true }))
    try {
      const updated = await updateProject(projectId, {
        name: overrides.name ?? project.name,
        description: overrides.description ?? project.description ?? '',
        status: overrides.status ?? project.status,
        client_name: overrides.client_name ?? project.client_name ?? '',
        client_id: overrides.client_id ?? project.client_id ?? '',
        start_date: overrides.start_date ?? project.start_date ?? '',
        end_date: overrides.end_date ?? project.end_date ?? '',
        budget: overrides.budget ?? project.budget?.toString() ?? '',
        project_type: overrides.project_type ?? project.project_type ?? '',
        location: overrides.location ?? project.location ?? '',
        location_url: overrides.location_url ?? project.location_url ?? '',
        expected_timeline: overrides.expected_timeline ?? project.expected_timeline ?? '',
        expected_payment_date: overrides.expected_payment_date ?? project.expected_payment_date ?? '',
      })
      onUpdate(updated)
      clearEdit(projectId)
      return updated
    } catch (err: any) {
      toast.error(err.message)
      return null
    } finally {
      setUpdating(prev => ({ ...prev, [projectId]: false }))
    }
  }

  async function handleStageChange(projectId: string, status: string) {
    const project = projects.find(p => p.id === projectId)
    if (!project) return
    const updated = await saveProject(projectId, { status })
    if (updated) toast.success('Stage updated')
  }

  async function handleFieldBlur(projectId: string, field: string, currentValue: string | null | undefined) {
    const val = getEdit(projectId, field)
    if (!val || val === (currentValue ?? '')) { clearEdit(projectId); return }
    const updated = await saveProject(projectId, { [field]: val })
    if (updated) toast.success(`${field} updated`)
  }

  function handleRevisionCountBlur(projectId: string) {
    const val = getEdit(projectId, 'revision_count')
    const project = projects.find(p => p.id === projectId)
    if (!project) return
    const currentVal = project.revision_count ?? 0
    const newVal = val ? Number(val) : 0
    if (newVal === currentVal) { clearEdit(projectId); return }
    const updated = { ...project, revision_count: newVal }
    onUpdate(updated)
    clearEdit(projectId)
    toast.success('Revision count updated')
  }

  async function handleAdvancePaidBlur(projectId: string) {
    const val = getEdit(projectId, 'advance_paid')
    if (!val) { clearEdit(projectId); return }
    const summary = paymentSummaries.find(s => s.project_id === projectId)
    const currentPaid = summary?.total_paid ?? 0
    const newPaid = Number(val)
    if (newPaid === currentPaid) { clearEdit(projectId); return }

    const difference = newPaid - currentPaid
    if (difference <= 0) {
      toast.error('To reduce Advance Paid, manage payments from the Payments page.')
      clearEdit(projectId)
      return
    }

    setUpdating(prev => ({ ...prev, [projectId]: true }))
    try {
      await createPayment({
        project_id: projectId,
        amount: String(difference),
        payment_date: new Date().toISOString().slice(0, 10),
        description: 'Advance (Ops View)',
        method: 'bank_transfer',
        status: 'completed',
      })
      clearEdit(projectId)
      toast.success('Advance Paid updated')
      onRefresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setUpdating(prev => ({ ...prev, [projectId]: false }))
    }
  }

  async function handleClientPhoneBlur(projectId: string) {
    const val = getEdit(projectId, 'contact_phone')
    const project = projects.find(p => p.id === projectId)
    if (!project?.client_id || !val) { clearEdit(projectId); return }
    const currentPhone = clientWhatsapp[project.client_id] ?? ''
    if (val === currentPhone) { clearEdit(projectId); return }

    setUpdating(prev => ({ ...prev, [projectId]: true }))
    try {
      const { error } = await supabase
        .from('clients')
        .update({ phone: val })
        .eq('id', project.client_id)
      if (error) throw error
      clearEdit(projectId)
      toast.success('Contact number updated')
      onRefresh()
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
              <TableHead className="w-[160px]">Project Name</TableHead>
              <TableHead className="w-[130px]">Client Name</TableHead>
              <TableHead className="w-[110px]">Contact</TableHead>
              <TableHead className="w-[88px]">WhatsApp</TableHead>
              <TableHead className="w-[100px]">Stage</TableHead>
              <TableHead className="w-[90px] text-right">Amount</TableHead>
              <TableHead className="w-[90px] text-right">Adv. Paid</TableHead>
              <TableHead className="w-[90px] text-right">Balance</TableHead>
              <TableHead className="w-[60px] text-center">Rev.</TableHead>
              <TableHead className="w-[170px]">Timeline</TableHead>
              <TableHead className="min-w-[110px]">Notes</TableHead>
              <TableHead className="w-[60px] text-right" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map(p => {
              const summary = paymentSummaries.find(s => s.project_id === p.id)
              const wpInfo = p.client_id ? clientPhones[p.client_id!] : undefined
              const isUpdating = updating[p.id]
              const startDays = p.start_date ? daysSince(p.start_date) : null
              const endDays = p.end_date ? daysUntil(p.end_date) : null
              return (
                <TableRow key={p.id} className="group">
                  {/* Project Name */}
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Input
                        type="text"
                        value={getEdit(p.id, 'name') || p.name}
                        onChange={e => setEdit(p.id, 'name', e.target.value)}
                        onFocus={e => { if (!getEdit(p.id, 'name')) e.target.value = p.name }}
                        onBlur={() => handleFieldBlur(p.id, 'name', p.name)}
                        onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
                        className="h-6 text-xs font-medium text-blue-600 px-1"
                      />
                      <Link
                        to={`/project/${p.id}`}
                        className="shrink-0 text-muted-foreground hover:text-blue-600 text-xs"
                        title="Open Project Workspace"
                      >
                        ↗
                      </Link>
                    </div>
                  </TableCell>

                  {/* Client Name */}
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Input
                        type="text"
                        value={getEdit(p.id, 'client_name') || (p.client_name ?? '')}
                        onChange={e => setEdit(p.id, 'client_name', e.target.value)}
                        onFocus={e => { if (!getEdit(p.id, 'client_name')) e.target.value = p.client_name ?? '' }}
                        onBlur={() => handleFieldBlur(p.id, 'client_name', p.client_name)}
                        onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
                        className="h-6 text-xs px-1"
                      />
                      {p.client_id && (
                        <Link
                          to={`/client/${p.client_id}`}
                          className="shrink-0 text-muted-foreground hover:text-blue-600 text-xs"
                          title="Open Client Workspace"
                        >
                          ↗
                        </Link>
                      )}
                    </div>
                  </TableCell>

                  {/* Contact Number */}
                  <TableCell>
                    <Input
                      type="text"
                      value={getEdit(p.id, 'contact_phone') || (wpInfo?.phone ?? '')}
                      onChange={e => setEdit(p.id, 'contact_phone', e.target.value)}
                      onFocus={e => { if (!getEdit(p.id, 'contact_phone')) e.target.value = wpInfo?.phone ?? '' }}
                      onBlur={() => handleClientPhoneBlur(p.id)}
                      onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
                      placeholder="-"
                      className="h-6 text-xs px-1"
                      disabled={!p.client_id}
                    />
                  </TableCell>

                  {/* WhatsApp Button */}
                  <TableCell>
                    {wpInfo ? (
                      <a
                        href={generateWhatsAppUrl(wpInfo.phone, `Hello, regarding your project.`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-6 w-full items-center justify-center rounded bg-green-600 px-1 text-[10px] font-semibold text-white hover:bg-green-700"
                      >
                        Chat
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>

                  {/* Stage */}
                  <TableCell>
                    <Select
                      value={p.status}
                      onChange={e => handleStageChange(p.id, e.target.value)}
                      className="h-7 text-xs"
                      disabled={isUpdating}
                    >
                      {STAGES.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </Select>
                  </TableCell>

                  {/* Amount */}
                  <TableCell className="text-right font-mono text-xs">
                    {isUpdating ? (
                      <span className="text-muted-foreground">...</span>
                    ) : (
                      <Input
                        type="number"
                        value={getEdit(p.id, 'budget') || (p.budget ?? '')}
                        onChange={e => setEdit(p.id, 'budget', e.target.value)}
                        onFocus={e => { if (!getEdit(p.id, 'budget')) e.target.value = String(p.budget ?? '') }}
                        onBlur={() => handleFieldBlur(p.id, 'budget', p.budget?.toString())}
                        onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
                        className="h-6 w-full text-right text-xs font-mono px-1"
                      />
                    )}
                  </TableCell>

                  {/* Advance Paid */}
                  <TableCell className="text-right font-mono text-xs">
                    <Input
                      type="number"
                      value={getEdit(p.id, 'advance_paid') || (summary?.total_paid ?? 0)}
                      onChange={e => setEdit(p.id, 'advance_paid', e.target.value)}
                      onFocus={e => { if (!getEdit(p.id, 'advance_paid')) e.target.value = String(summary?.total_paid ?? 0) }}
                      onBlur={() => handleAdvancePaidBlur(p.id)}
                      onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
                      className="h-6 w-full text-right text-xs font-mono px-1"
                    />
                  </TableCell>

                  {/* Balance */}
                  <TableCell className="text-right font-mono text-xs font-semibold">
                    {summary != null
                      ? formatCurrency(summary.balance_due)
                      : p.budget != null ? formatCurrency(Number(p.budget)) : '-'}
                  </TableCell>

                  {/* Revision Count */}
                  <TableCell className="text-center">
                    <Input
                      type="number"
                      min="0"
                      value={getEdit(p.id, 'revision_count') || (p.revision_count ?? 0)}
                      onChange={e => setEdit(p.id, 'revision_count', e.target.value)}
                      onFocus={e => { if (!getEdit(p.id, 'revision_count')) e.target.value = String(p.revision_count ?? 0) }}
                      onBlur={() => handleRevisionCountBlur(p.id)}
                      onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
                      className="h-6 w-12 text-center text-xs font-mono px-1"
                    />
                  </TableCell>

                  {/* Timeline */}
                  <TableCell className="text-xs whitespace-nowrap">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1">
                        <Input
                          type="date"
                          value={getEdit(p.id, 'start_date') || (p.start_date ?? '')}
                          onChange={e => setEdit(p.id, 'start_date', e.target.value)}
                          onBlur={() => handleFieldBlur(p.id, 'start_date', p.start_date)}
                          className="h-6 w-[84px] text-[10px] px-1"
                        />
                        <span className="text-muted-foreground">→</span>
                        <Input
                          type="date"
                          value={getEdit(p.id, 'end_date') || (p.end_date ?? '')}
                          onChange={e => setEdit(p.id, 'end_date', e.target.value)}
                          onBlur={() => handleFieldBlur(p.id, 'end_date', p.end_date)}
                          className="h-6 w-[84px] text-[10px] px-1"
                        />
                      </div>
                      {p.start_date && startDays != null && (
                        <span className="text-[10px] text-muted-foreground">
                          Started {startDays}d ago
                          {p.end_date && endDays != null
                            ? ` · ${endDays >= 0 ? `${endDays}d left` : `${Math.abs(endDays)}d overdue`}`
                            : ''}
                        </span>
                      )}
                    </div>
                  </TableCell>

                  {/* Notes */}
                  <TableCell className="text-xs max-w-[110px]">
                    <Input
                      type="text"
                      value={getEdit(p.id, 'description') || (p.description ?? '')}
                      onChange={e => setEdit(p.id, 'description', e.target.value)}
                      onFocus={e => { if (!getEdit(p.id, 'description')) e.target.value = p.description ?? '' }}
                      onBlur={() => handleFieldBlur(p.id, 'description', p.description)}
                      onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
                      placeholder="-"
                      className="h-6 text-xs px-1"
                    />
                  </TableCell>

                  {/* Actions */}
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
          <tfoot>
            <TableRow className="border-t-2 border-border bg-muted font-semibold">
              <TableCell colSpan={5} className="text-xs font-semibold">
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
              <TableCell colSpan={4} />
            </TableRow>
          </tfoot>
        </Table>
      </div>

      {/* Mobile card view */}
      <div className="space-y-2 md:hidden">
        {projects.map(p => {
          const summary = paymentSummaries.find(s => s.project_id === p.id)
          const wp = p.client_id ? clientWhatsapp[p.client_id] : undefined
          const startDays = p.start_date ? daysSince(p.start_date) : null
          const endDays = p.end_date ? daysUntil(p.end_date) : null
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
                      <span className="text-muted-foreground">Rev: {p.revision_count ?? 0}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      {p.start_date || p.end_date ? (
                        <span>
                          {p.start_date ?? '…'} → {p.end_date ?? '…'}
                          {startDays != null ? ` (Started ${startDays}d ago` : ''}
                          {endDays != null ? `${startDays != null ? ',' : ' ('} ${endDays >= 0 ? `${endDays}d left` : `${Math.abs(endDays)}d overdue`})` : startDays != null ? ')' : ''}
                        </span>
                      ) : null}
                    </div>
                    {p.description && (
                      <p className="mt-1 text-xs text-muted-foreground truncate">{p.description}</p>
                    )}
                    <div className="mt-1 flex items-center gap-2 text-xs">
                      {wp && (
                        <a
                          href={generateWhatsAppUrl(wp, `Hello, regarding your project.`)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex h-6 items-center rounded bg-green-600 px-2 text-[10px] font-semibold text-white hover:bg-green-700"
                        >
                          WhatsApp
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <div className="flex gap-1">
                      <Button variant="link" size="sm" className="h-6 text-xs px-1" onClick={() => onEdit(p)}>Edit</Button>
                      <Button variant="link" size="sm" className="h-6 text-xs px-1 text-destructive" onClick={() => onDelete(p)}>Del</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
        <Card className="border-2 border-border">
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
