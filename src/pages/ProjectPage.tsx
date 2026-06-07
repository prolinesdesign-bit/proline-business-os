import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getProjects } from '../lib/api/projects'
import { getProjectCalendarEvents } from '../lib/api/calendar'
import type { Project, CalendarEvent, CalendarDay } from '../types'
import AppLayout from '../components/layout/AppLayout'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Skeleton } from '../components/ui/Skeleton'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-500',
  completed: 'bg-blue-500',
  on_hold: 'bg-yellow-500',
  cancelled: 'bg-red-500',
  scheduled: 'bg-purple-500',
}

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

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [eventsLoading, setEventsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('list')
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth())
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    setLoading(true)
    getProjects('')
      .then(all => {
        if (!cancelled) {
          const p = all.find(x => x.id === id)
          setProject(p ?? null)
        }
      })
      .catch(err => console.error('Failed to load project:', err))
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [id])

  useEffect(() => {
    if (!id) return
    let cancelled = false
    setEventsLoading(true)
    getProjectCalendarEvents(id)
      .then(events => { if (!cancelled) setEvents(events) })
      .catch(console.error)
      .finally(() => { if (!cancelled) setEventsLoading(false) })
    return () => { cancelled = true }
  }, [id])

  const groupedEvents = useMemo(() => {
    const groups: Record<string, CalendarEvent[]> = {}
    for (const e of events) {
      if (!groups[e.date]) groups[e.date] = []
      groups[e.date].push(e)
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
  }, [events])

  const badgeVariant: Record<string, 'success' | 'default' | 'warning' | 'destructive'> = {
    lead: 'warning',
    communicated: 'default',
    advance_paid: 'success',
    prelim_model: 'default',
    discussed: 'default',
    final_render: 'default',
    balance_paid: 'success',
    delivered: 'default',
    cancelled: 'destructive',
  }

  function isOverdue(event: CalendarEvent) {
    return event.type === 'due' && event.status !== 'completed' && new Date(event.date) < new Date()
  }

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }

  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  function goToday() {
    const now = new Date()
    setYear(now.getFullYear())
    setMonth(now.getMonth())
  }

  const days = buildCalendar(year, month, events)
  const weeks: CalendarDay[][] = []
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7))
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-5xl px-4 py-6">
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-4 w-96 mb-8" />
          <div className="grid gap-4 sm:grid-cols-3">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        </div>
      </AppLayout>
    )
  }

  if (!project) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-5xl px-4 py-6">
          <p className="text-center text-muted-foreground py-12">Project not found.</p>
          <div className="text-center">
            <Link to="/projects" className="text-sm text-blue-600 hover:underline">← Back to Projects</Link>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-5xl px-4 py-6">
        <Link to="/projects" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to Projects
        </Link>

        <div className="mt-2 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{project.name}</h1>
            {project.client_name && (
              <p className="text-muted-foreground">{project.client_name}</p>
            )}
          </div>
          <Badge variant={badgeVariant[project.status] ?? 'default'}>
            {project.status.replace('_', ' ')}
          </Badge>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-medium uppercase text-muted-foreground">Budget</p>
              <p className="mt-1 text-xl font-bold">
                {project.budget != null ? `₹${Number(project.budget).toLocaleString()}` : '-'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-medium uppercase text-muted-foreground">Start Date</p>
              <p className="mt-1 text-xl font-bold">{project.start_date ?? '-'}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-medium uppercase text-muted-foreground">Due Date</p>
              <p className="mt-1 text-xl font-bold">{project.end_date ?? '-'}</p>
            </CardContent>
          </Card>
        </div>

        {project.description && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{project.description}</p>
            </CardContent>
          </Card>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild>
            <Link to={`/payments`}>Payments</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to={`/documents?project_id=${project.id}`}>Documents</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to={`/sitevisits`}>Site Visits</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to={`/proposals`}>Proposals</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to={`/expenses`}>Expenses</Link>
          </Button>
        </div>

        {/* Schedule Section */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Schedule</h2>
            <div className="flex items-center gap-2">
              <div className="flex overflow-hidden rounded-lg border border-border text-xs">
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`px-3 py-1.5 transition-colors ${viewMode === 'calendar' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:bg-accent'}`}
                >
                  Calendar
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1.5 transition-colors ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:bg-accent'}`}
                >
                  List
                </button>
              </div>
              {viewMode === 'calendar' && (
                <>
                  <Button variant="outline" size="sm" onClick={prevMonth}>&larr;</Button>
                  <Button variant="outline" size="sm" onClick={goToday}>Today</Button>
                  <Button variant="outline" size="sm" onClick={nextMonth}>&rarr;</Button>
                </>
              )}
            </div>
          </div>

          {viewMode === 'calendar' && (
            <h3 className="mb-3 text-sm font-medium text-muted-foreground">
              {new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
          )}

          {eventsLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : events.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No events scheduled for this project.</p>
          ) : viewMode === 'list' ? (
            <div className="space-y-2">
              {groupedEvents.map(([date, evts]) => (
                <Card key={date}>
                  <CardContent className="p-3">
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </p>
                    <div className="space-y-1.5">
                      {evts.map(e => (
                        <div key={`${e.id}-${e.type}`} className={`flex items-center justify-between rounded-lg px-3 py-2 ${e.type === 'site_visit' ? 'bg-purple-50 dark:bg-purple-950/30' : isOverdue(e) ? 'bg-red-50 dark:bg-red-950/30' : 'bg-muted'}`}>
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`h-2 w-2 shrink-0 rounded-full ${STATUS_COLORS[e.status] ?? 'bg-gray-400'}`} />
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{e.name}</p>
                              {e.client_name && <p className="text-xs text-muted-foreground">{e.client_name}</p>}
                            </div>
                          </div>
                          <Badge variant={
                            e.type === 'site_visit' ? 'purple' :
                            e.type === 'start' ? 'default' :
                            isOverdue(e) ? 'destructive' : 'secondary'
                          } className="text-[10px] px-1.5 py-0 shrink-0 ml-2">
                            {e.type === 'site_visit' ? 'Visit' : e.type === 'start' ? 'Start' : 'Due'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <>
              <Card className="overflow-hidden">
                <div className="grid grid-cols-7 border-b border-border bg-muted">
                  {DAYS.map(d => (
                    <div key={d} className="px-2 py-2 text-center text-xs font-medium text-muted-foreground uppercase tracking-wide">{d}</div>
                  ))}
                </div>
                {weeks.map((week, wi) => (
                  <div key={wi} className="grid grid-cols-7 overflow-hidden border-b border-border last:border-0">
                    {week.map((day, di) => (
                      <button
                        key={di}
                        onClick={() => day.events.length > 0 && setSelectedDay(day)}
                        className={`min-h-[50px] p-1 border-r border-border last:border-0 text-left transition-colors hover:bg-accent ${
                          !day.isCurrentMonth ? 'bg-muted/50' : ''
                        } ${day.isThisWeek ? 'ring-1 ring-inset ring-blue-200 dark:ring-blue-400/30' : ''}`}
                      >
                        <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-medium ${
                          day.isToday ? 'bg-blue-600 text-white' : day.isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'
                        }`}>
                          {day.day}
                        </span>
                        <div className="mt-0.5 space-y-0.5">
                          {day.events.slice(0, 2).map(e => (
                            <div
                              key={`${e.id}-${e.type}`}
                              className={`flex items-center gap-1 rounded px-1 py-0.5 text-[10px] font-medium leading-tight ${
                                isOverdue(e) ? 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300' : e.type === 'site_visit' ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300' : 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
                              }`}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${STATUS_COLORS[e.status] ?? 'bg-gray-400'}`} />
                              <span className="truncate">{e.name}</span>
                            </div>
                          ))}
                          {day.events.length > 2 && (
                            <p className="text-[10px] text-muted-foreground pl-1">+{day.events.length - 2} more</p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                ))}
              </Card>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-500" /> Active</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-500" /> Completed</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-purple-500" /> Site Visit</span>
                <span className="flex items-center gap-1"><Badge variant="destructive" className="rounded-sm px-1.5 py-0.5">Overdue</Badge></span>
              </div>
            </>
          )}

          {/* Day detail modal */}
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
                            {e.client_name ?? 'No client'} — {e.type === 'start' ? 'Start' : e.type === 'site_visit' ? 'Site Visit' : 'Due'}
                          </p>
                        </div>
                        <Badge variant={
                          e.status === 'final_render' || e.status === 'balance_paid' || e.status === 'delivered' || e.status === 'completed' ? 'default' :
                          e.status === 'advance_paid' || e.status === 'active' ? 'success' :
                          e.status === 'on_hold' ? 'warning' :
                          'secondary'
                        }>
                          {e.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
