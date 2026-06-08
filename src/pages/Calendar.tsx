import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCalendarEvents } from '../lib/api/calendar'
import { buildCalendar } from '../lib/calendar'
import type { CalendarEvent, CalendarDay } from '../types'
import AppLayout from '../components/layout/AppLayout'
import { Button } from '../components/ui/Button'
import { Card, CardContent } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Skeleton } from '../components/ui/Skeleton'

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-success',
  completed: 'bg-primary',
  on_hold: 'bg-warning',
  cancelled: 'bg-destructive',
  scheduled: 'bg-purple',
}

const STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  completed: 'Completed',
  on_hold: 'On Hold',
  cancelled: 'Cancelled',
  scheduled: 'Scheduled',
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function Calendar() {
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar')
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth())
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null)

  const groupedEvents = useMemo(() => {
    const groups: Record<string, CalendarEvent[]> = {}
    for (const e of events) {
      if (!groups[e.date]) groups[e.date] = []
      groups[e.date].push(e)
    }
    const sorted = Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
    return sorted
  }, [events])

  useEffect(() => {
    getCalendarEvents()
      .then(setEvents)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const days = buildCalendar(year, month, events)
  const weeks: CalendarDay[][] = []
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7))
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

  function isOverdue(event: CalendarEvent) {
    return event.type === 'due' && event.status !== 'completed' && new Date(event.date) < new Date()
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-3xl tracking-tight">Calendar</h1>
          <div className="flex items-center gap-2">
            <div className="flex overflow-hidden rounded-lg border border-border text-xs mr-2">
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
            <Button variant="outline" size="sm" onClick={prevMonth}>&larr;</Button>
            <Button variant="outline" size="sm" onClick={goToday}>Today</Button>
            <Button variant="outline" size="sm" onClick={nextMonth}>&rarr;</Button>
          </div>
        </div>

        <h2 className="mb-4 font-display text-xl tracking-tight">
          {new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h2>

        {loading ? (
          <Skeleton className="h-96 w-full" />
        ) : viewMode === 'list' ? (
          <div className="space-y-2">
            {groupedEvents.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">No events this month.</p>
            ) : (
              groupedEvents.map(([date, evts]) => (
                <Card key={date}>
                  <CardContent className="p-3">
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </p>
                    <div className="space-y-1.5">
                      {evts.map(e => (
                        <div key={`${e.id}-${e.type}`} className={`flex items-center justify-between rounded-lg px-3 py-2 ${e.type === 'site_visit' ? 'bg-purple-light/50 dark:bg-purple-950/30' : isOverdue(e) ? 'bg-destructive-light dark:bg-red-950/30' : 'bg-muted'}`}>
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`h-2 w-2 shrink-0 rounded-full ${STATUS_COLORS[e.status] ?? 'bg-gray-400'}`} />
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{e.name}</p>
                              {e.client_name && <p className="text-xs text-muted-foreground">{e.client_name}</p>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            <Badge variant={
                              e.type === 'site_visit' ? 'purple' :
                              e.type === 'start' ? 'default' :
                              isOverdue(e) ? 'destructive' : 'secondary'
                            } className="text-[10px] px-1.5 py-0">
                              {e.type === 'site_visit' ? 'Visit' : e.type === 'start' ? 'Start' : 'Due'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
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
                      className={`min-h-[60px] p-1 sm:min-h-[90px] sm:p-1.5 border-r border-border last:border-0 text-left transition-colors hover:bg-accent ${
                        !day.isCurrentMonth ? 'bg-muted/50' : ''
                      } ${day.isThisWeek ? 'ring-1 ring-inset ring-blue-200 dark:ring-blue-400/30' : ''}`}
                    >
                      <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-medium sm:h-6 sm:w-6 sm:text-xs ${
                        day.isToday ? 'bg-primary text-white' : day.isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'
                      }`}>
                        {day.day}
                      </span>
                      <div className="mt-1 space-y-0.5">
                        {day.events.slice(0, 3).map(e => (
                          <div
                            key={`${e.id}-${e.type}`}
                            className={`flex items-center gap-1 rounded px-1 py-0.5 text-[10px] font-medium leading-tight ${
                              isOverdue(e) ? 'bg-destructive-light text-destructive dark:bg-red-950/50 dark:text-red-300' : e.type === 'site_visit' ? 'bg-purple-light text-purple dark:bg-purple-950/50 dark:text-purple-300' : 'bg-primary-light text-primary dark:bg-blue-950/50 dark:text-blue-300'
                            }`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${STATUS_COLORS[e.status] ?? 'bg-gray-400'}`} />
                            <span className="truncate">{e.name}</span>
                            {e.type === 'start' && <span className="shrink-0 opacity-60">S</span>}
                            {e.type === 'due' && <span className="shrink-0 opacity-60">D</span>}
                            {e.type === 'site_visit' && <span className="shrink-0 opacity-60 text-purple-600 dark:text-purple-400">V</span>}
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

            {/* Legend */}
            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-success" /> Active</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-primary" /> Completed</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-warning" /> On Hold</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-destructive" /> Cancelled</span>
              <span className="flex items-center gap-1"><Badge variant="destructive" className="rounded-sm px-1.5 py-0.5">Overdue</Badge></span>
               <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-full border-2 border-blue-200 dark:border-blue-400/30" /> This Week</span>
              <span className="flex items-center gap-1">S = Start &nbsp; D = Due</span>
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
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          e.status === 'final_render' || e.status === 'balance_paid' || e.status === 'delivered' || e.status === 'completed' ? 'default' :
                          e.status === 'advance_paid' || e.status === 'active' ? 'success' :
                          e.status === 'on_hold' ? 'warning' :
                          'secondary'
                        }>
                          {STATUS_LABELS[e.status] ?? e.status}
                        </Badge>
                        <Button variant="link" size="sm" asChild>
                          <Link to={e.type === 'site_visit' ? '/sitevisits' : '/projects'}>View</Link>
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
