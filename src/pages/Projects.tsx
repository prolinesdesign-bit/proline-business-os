import { useEffect, useState, useCallback, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { Project, ProjectFormData, SiteVisit, ProjectPaymentSummary, CalendarEvent, CalendarDay } from '../types'
import { getProjects, updateProject, deleteProject } from '../lib/api/projects'
import { getDocumentCounts } from '../lib/api/documents'
import { getProjectSummaries } from '../lib/api/payments'
import { supabase } from '../lib/supabase'
import ProjectCard from '../components/projects/ProjectCard'
import ProjectForm from '../components/projects/ProjectForm'
import ProjectsOperationsView from '../components/projects/ProjectsOperationsView'
import WhatsAppModal from '../components/WhatsAppModal'
import AppLayout from '../components/layout/AppLayout'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { toast } from 'sonner'
import { CardSkeleton } from '../components/ui/Skeleton'
import { EmptyState } from '../components/ui/EmptyState'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function getWeekBounds(now: Date) {
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

function buildCalendar(year: number, month: number, events: CalendarEvent[]): CalendarDay[] {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startPad = firstDay.getDay()
  const totalDays = lastDay.getDate()
  const today = new Date()
  const todayStr = today.toDateString()
  const { monday, sunday } = getWeekBounds(today)

  const days: CalendarDay[] = []

  for (let i = 0; i < startPad; i++) {
    const d = new Date(year, month, i - startPad + 1)
    days.push({ date: d, day: d.getDate(), isCurrentMonth: false, isToday: false, isThisWeek: false, events: [] })
  }

  for (let i = 1; i <= totalDays; i++) {
    const d = new Date(year, month, i)
    const isToday = d.toDateString() === todayStr
    const isThisWeek = d >= monday && d <= sunday
    const dateStr = d.toISOString().slice(0, 10)
    const dayEvents = events.filter(e => e.date === dateStr)
    days.push({ date: d, day: i, isCurrentMonth: true, isToday, isThisWeek, events: dayEvents })
  }

  const remaining = 42 - days.length
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, month + 1, i)
    days.push({ date: d, day: d.getDate(), isCurrentMonth: false, isToday: false, isThisWeek: false, events: [] })
  }

  return days
}

type Period = 'current_month' | 'last_month' | 'last_6_months' | 'this_year' | 'custom'

function getPeriodRange(period: Period, customStart?: string, customEnd?: string): { start: string; end: string } | null {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()

  switch (period) {
    case 'current_month': {
      const start = new Date(y, m, 1)
      const end = new Date(y, m + 1, 0)
      return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) }
    }
    case 'last_month': {
      const start = new Date(y, m - 1, 1)
      const end = new Date(y, m, 0)
      return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) }
    }
    case 'last_6_months': {
      const start = new Date(y, m - 5, 1)
      const end = new Date(y, m + 1, 0)
      return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) }
    }
    case 'this_year': {
      const start = new Date(y, 0, 1)
      const end = new Date(y, 11, 31)
      return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) }
    }
    case 'custom': {
      if (!customStart || !customEnd) return null
      return { start: customStart, end: customEnd }
    }
  }
}

function isProjectInPeriod(p: Project, start: string, end: string): boolean {
  if (p.start_date && p.start_date >= start && p.start_date <= end) return true
  if (p.end_date && p.end_date >= start && p.end_date <= end) return true
  if (p.start_date && p.start_date <= end && (!p.end_date || p.end_date >= start)) return true
  return false
}

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: 'current_month', label: 'Current Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'last_6_months', label: 'Last 6 Months' },
  { value: 'this_year', label: 'This Year' },
  { value: 'custom', label: 'Custom' },
]

const STAGE_FILTER_OPTIONS = [
  { value: '', label: 'All Stages' },
  { value: 'lead', label: 'Lead' },
  { value: 'communicated', label: 'Communicated' },
  { value: 'advance_paid', label: 'Advance Paid' },
  { value: 'prelim_model', label: 'Prelim Model' },
  { value: 'discussed', label: 'Discussed' },
  { value: 'final_render', label: 'Final Render' },
  { value: 'balance_paid', label: 'Balance Paid' },
  { value: 'delivered', label: 'Delivered' },
]

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: 'name', label: 'Project Name' },
  { value: 'client_name', label: 'Client Name' },
  { value: 'end_date', label: 'Deadline' },
  { value: 'budget', label: 'Amount' },
]

export default function Projects() {
  const navigate = useNavigate()
  const [viewMode, setViewMode] = useState<'card' | 'operations' | 'calendar'>('operations')
  const [calYear, setCalYear] = useState(new Date().getFullYear())
  const [calMonth, setCalMonth] = useState(new Date().getMonth())
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [paymentSummaries, setPaymentSummaries] = useState<ProjectPaymentSummary[]>([])
  const [docCounts, setDocCounts] = useState<Record<string, number>>({})
  const [svPhotoCounts, setSvPhotoCounts] = useState<Record<string, number>>({})
  const [clientWhatsapp, setClientWhatsapp] = useState<Record<string, string>>({})
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Project | null>(null)
  const [deleting, setDeleting] = useState<Project | null>(null)
  const [whatsappTarget, setWhatsappTarget] = useState<{ phone: string; name: string } | null>(null)
  const [period, setPeriod] = useState<Period>('current_month')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [stageFilter, setStageFilter] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const periodRange = getPeriodRange(period, customStart, customEnd)

  const opsProjects = useMemo(() => {
    let list = periodRange
      ? projects.filter(p => isProjectInPeriod(p, periodRange.start, periodRange.end))
      : [...projects]

    if (stageFilter) {
      list = list.filter(p => p.status === stageFilter)
    }

    list.sort((a, b) => {
      let cmp = 0
      switch (sortBy) {
        case 'name':
          cmp = a.name.localeCompare(b.name)
          break
        case 'client_name':
          cmp = (a.client_name ?? '').localeCompare(b.client_name ?? '')
          break
        case 'end_date':
          cmp = (a.end_date ?? '').localeCompare(b.end_date ?? '')
          break
        case 'budget':
          cmp = (a.budget ?? 0) - (b.budget ?? 0)
          break
      }
      return sortDir === 'desc' ? -cmp : cmp
    })

    return list
  }, [projects, periodRange, stageFilter, sortBy, sortDir])

  const calendarEvents: CalendarEvent[] = projects.flatMap(p => {
    const evts: CalendarEvent[] = []
    if (p.start_date) {
      evts.push({ id: p.id, name: p.name, client_name: p.client_name, status: p.status, type: 'start', date: p.start_date })
    }
    if (p.end_date) {
      evts.push({ id: p.id, name: p.name, client_name: p.client_name, status: p.status, type: 'due', date: p.end_date })
    }
    return evts
  }).sort((a, b) => a.date.localeCompare(b.date))

  const calendarDays = buildCalendar(calYear, calMonth, calendarEvents)
  const calendarWeeks: CalendarDay[][] = []
  for (let i = 0; i < calendarDays.length; i += 7) {
    calendarWeeks.push(calendarDays.slice(i, i + 7))
  }

  function prevMonth() {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11) }
    else setCalMonth(m => m - 1)
  }

  function nextMonth() {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0) }
    else setCalMonth(m => m + 1)
  }

  function goToday() {
    const now = new Date()
    setCalYear(now.getFullYear())
    setCalMonth(now.getMonth())
  }

  function isOverdue(event: CalendarEvent) {
    return event.type === 'due' && event.status !== 'completed' && new Date(event.date) < new Date()
  }

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const [data, counts, svRes, summaries] = await Promise.all([
        getProjects(search),
        getDocumentCounts(),
        supabase.from('site_visits').select('project_id, photo_urls'),
        getProjectSummaries(),
      ])
      setProjects(data)
      setDocCounts(counts)
      setPaymentSummaries(summaries)

      const photoCounts: Record<string, number> = {}
      for (const sv of (svRes.data ?? []) as SiteVisit[]) {
        if (sv.project_id) {
          const urls = sv.photo_urls as unknown as string[]
          photoCounts[sv.project_id] = (photoCounts[sv.project_id] ?? 0) + (urls?.length ?? 0)
        }
      }
      setSvPhotoCounts(photoCounts)

      const ids = data.map(p => p.client_id).filter(Boolean) as string[]
      if (ids.length > 0) {
        const { data: clients } = await supabase
          .from('clients')
          .select('id, phone, name')
          .in('id', ids)
        const map: Record<string, string> = {}
        for (const c of clients ?? []) {
          if (c.phone && c.phone.replace(/\s/g, '')) map[c.id] = c.phone.replace(/\s/g, '')
        }
        setClientWhatsapp(map)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    fetch()
  }, [fetch])

  async function handleProjectCreated(projectId: string) {
    toast.success('Project created')
    setShowForm(false)
    navigate(`/project/${projectId}`)
  }

  async function handleEditSave(data: ProjectFormData) {
    if (!editing) return
    try {
      await updateProject(editing.id, data)
      toast.success('Project updated')
      setShowForm(false)
      setEditing(null)
      fetch()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save project')
    }
  }

  async function handleDelete() {
    if (!deleting) return
    try {
      await deleteProject(deleting.id)
      toast.success('Project deleted')
      setDeleting(null)
      fetch()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete project')
    }
  }

  return (
    <AppLayout>
      <div className={`mx-auto px-4 py-6 ${viewMode === 'operations' ? 'max-w-7xl' : 'max-w-4xl'}`}>
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-3xl tracking-tight">Projects</h1>
        <div className="flex items-center gap-2">
          <div className="flex overflow-hidden rounded-lg border border-border text-xs">
            <button
              onClick={() => setViewMode('card')}
              className={`px-3 py-1.5 transition-colors ${viewMode === 'card' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:bg-accent'}`}
            >
              Cards
            </button>
            <button
              onClick={() => setViewMode('operations')}
              className={`px-3 py-1.5 transition-colors ${viewMode === 'operations' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:bg-accent'}`}
            >
              Ops
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 transition-colors ${viewMode === 'calendar' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:bg-accent'}`}
            >
              Calendar
            </button>
          </div>
          {viewMode === 'calendar' ? (
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={prevMonth}>&larr;</Button>
              <span className="text-sm font-medium min-w-[140px] text-center">
                {new Date(calYear, calMonth).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </span>
              <Button variant="outline" size="sm" onClick={nextMonth}>&rarr;</Button>
              <Button variant="outline" size="sm" onClick={goToday}>Today</Button>
            </div>
          ) : (
            <Button onClick={() => setShowForm(true)}>
              + Add Project
            </Button>
          )}
        </div>
      </div>

      <Input
        type="text"
        placeholder="Search projects..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="mt-4 w-full"
      />

      {loading ? (
        viewMode === 'operations' ? (
          <div className="mt-4 space-y-3">
            <CardSkeleton /><CardSkeleton /><CardSkeleton />
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton />
          </div>
        )
      ) : projects.length === 0 ? (
        <div className="mt-8">
          {search ? (
            <EmptyState title="No results" description="No projects match your search." />
          ) : (
            <EmptyState title="No projects yet" description="Click + Add Project to create your first project." />
          )}
        </div>
      ) : viewMode === 'calendar' ? (
        <div className="mt-4">
          <Card className="overflow-hidden">
            <div className="grid grid-cols-7 border-b border-border bg-muted">
              {DAYS.map(d => (
                <div key={d} className="px-2 py-2 text-center text-xs font-medium text-muted-foreground uppercase tracking-wide">{d}</div>
              ))}
            </div>
            {calendarWeeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 overflow-hidden border-b border-border last:border-0">
                {week.map((day, di) => (
                  <button
                    key={di}
                    onClick={() => day.events.length > 0 && setSelectedDay(day)}
                    className={`min-h-[60px] p-1 sm:min-h-[80px] sm:p-1.5 border-r border-border last:border-0 text-left transition-colors hover:bg-accent ${
                      !day.isCurrentMonth ? 'bg-muted/50' : ''
                    } ${day.isThisWeek ? 'ring-1 ring-inset ring-blue-200 dark:ring-blue-400/30' : ''}`}
                  >
                    <span className={`inline-flex h-5 w-5 items-center justify-center text-xs font-medium sm:h-6 sm:w-6 sm:text-sm ${
                      day.isToday ? 'bg-blue-600 text-white rounded' : day.isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'
                    }`}>
                      {day.day}
                    </span>
                    <div className="mt-1 space-y-0.5">
                      {day.events.slice(0, 3).map(e => (
                        <div
                          key={`${e.id}-${e.type}`}
                          className={`flex items-center gap-1 rounded px-1 py-0.5 text-[10px] font-medium leading-tight ${
                            isOverdue(e) ? 'bg-destructive-light text-destructive dark:bg-red-950/50 dark:text-red-300' : e.type === 'start' ? 'bg-primary-light text-primary dark:bg-blue-950/50 dark:text-blue-300' : 'bg-warning-light text-warning dark:bg-yellow-950/50 dark:text-yellow-300'
                          }`}
                        >
                          <span className="truncate">{e.name}</span>
                          {e.type === 'start' && <span className="shrink-0 opacity-60">S</span>}
                          {e.type === 'due' && <span className="shrink-0 opacity-60">D</span>}
                        </div>
                      ))}
                      {day.events.length > 3 && (
                        <p className="text-[10px] text-muted-foreground pl-1">+{day.events.length - 3} more</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ))}
          </Card>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><span className="h-2 w-2 bg-primary" /> Start</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 bg-warning" /> Due</span>
            <span className="flex items-center gap-1"><span className="text-xs font-medium text-destructive bg-destructive-light px-1.5 py-0.5 rounded">Overdue</span></span>
          </div>
        </div>
      ) : viewMode === 'operations' ? (
        <div className="mt-4">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Select
              value={stageFilter}
              onChange={e => setStageFilter(e.target.value)}
              className="h-8 w-32 text-sm"
            >
              {STAGE_FILTER_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>

            <div className="flex items-center gap-1">
              <Select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="h-8 w-36 text-sm"
              >
                {SORT_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </Select>
              <button
                onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
                className="flex h-8 w-8 items-center justify-center border border-border rounded text-sm text-muted-foreground hover:bg-muted transition-colors"
                title={sortDir === 'asc' ? 'Ascending' : 'Descending'}
              >
                {sortDir === 'asc' ? '\u2191' : '\u2193'}
              </button>
            </div>

            <div className="flex items-center gap-1">
              {PERIOD_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { setPeriod(opt.value); if (opt.value !== 'custom') { setCustomStart(''); setCustomEnd('') } }}
                  className={`px-3 py-1.5 text-sm rounded transition-colors ${
                    period === opt.value
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {opt.label === 'Current Month' ? 'This Month' : opt.label}
                </button>
              ))}
            </div>

            {period === 'custom' && (
              <div className="flex items-center gap-1">
                <Input
                  type="date"
                  value={customStart}
                  onChange={e => setCustomStart(e.target.value)}
                  className="h-8 w-32 text-sm"
                />
                <span className="text-sm text-muted-foreground">→</span>
                <Input
                  type="date"
                  value={customEnd}
                  onChange={e => setCustomEnd(e.target.value)}
                  className="h-8 w-32 text-sm"
                />
              </div>
            )}

            {periodRange && period !== 'custom' && (
              <span className="text-xs text-muted-foreground/60 whitespace-nowrap">
                {periodRange.start} — {periodRange.end}
              </span>
            )}
          </div>

          {opsProjects.length === 0 ? (
            <EmptyState title="No projects in this period" description="Try a different date range or stage filter." />
          ) : (
            <ProjectsOperationsView
              projects={opsProjects}
              paymentSummaries={paymentSummaries}
              clientWhatsapp={clientWhatsapp}
              onEdit={(p) => { setEditing(p); setShowForm(true) }}
              onDelete={(p) => setDeleting(p)}
              onUpdate={(updated) => {
                setProjects(prev => prev.map(pr => pr.id === updated.id ? updated : pr))
              }}
              onRefresh={fetch}
            />
          )}
        </div>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {projects.map(p => {
            const wp = p.client_id ? clientWhatsapp[p.client_id] : undefined
            return (
              <div key={p.id} className="hover:shadow-md transition-shadow">
                <ProjectCard
                  project={p}
                  docCount={docCounts[p.id] ?? 0}
                  siteVisitPhotoCount={svPhotoCounts[p.id] ?? 0}
                  onEdit={() => { setEditing(p); setShowForm(true) }}
                  onDelete={() => setDeleting(p)}
                />
                {wp && (
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => setWhatsappTarget({ phone: wp, name: p.client_name ?? p.name })}
                    className="mt-1"
                  >
                    WhatsApp {p.client_name}
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {showForm && (
        <ProjectForm
          project={editing}
          onSuccess={handleProjectCreated}
          onSave={handleEditSave}
          onCancel={() => { setShowForm(false); setEditing(null) }}
        />
      )}

      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-sm">
            <CardHeader>
              <CardTitle>Delete Project</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Are you sure you want to delete <strong>{deleting.name}</strong>? This cannot be undone.
              </p>
              <div className="mt-5 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button>
                <Button variant="destructive" onClick={handleDelete}>Delete</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {whatsappTarget && (
        <WhatsAppModal
          phone={whatsappTarget.phone}
          clientName={whatsappTarget.name}
          onClose={() => setWhatsappTarget(null)}
        />
      )}

      {selectedDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setSelectedDay(null)}>
          <div className="w-full max-w-lg rounded-xl bg-card p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">
                {selectedDay.date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </h2>
              <button onClick={() => setSelectedDay(null)} className="text-muted-foreground hover:text-foreground">&times;</button>
            </div>
            {selectedDay.events.length === 0 ? (
              <p className="text-sm text-muted-foreground">No events on this day.</p>
            ) : (
              <div className="space-y-2">
                {selectedDay.events.map(e => (
                  <div key={`${e.id}-${e.type}`} className="flex items-center justify-between rounded-lg bg-muted px-4 py-3">
                    <div>
                      <p className="text-sm font-medium">{e.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {e.client_name ?? 'No client'} — {e.type === 'start' ? 'Start' : 'Due'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        e.status === 'final_render' || e.status === 'balance_paid' || e.status === 'delivered' || e.status === 'completed' ? 'default' :
                        e.status === 'advance_paid' || e.status === 'active' ? 'success' :
                        e.status === 'on_hold' ? 'warning' :
                        'secondary'
                      }>
                        {e.status.replace('_', ' ')}
                      </Badge>
                      <Button variant="link" size="sm" asChild>
                        <Link to={`/project/${e.id}`}>View</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
    </AppLayout>
  )
}
