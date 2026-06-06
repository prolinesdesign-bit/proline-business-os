import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCalendarEvents } from '../lib/api/calendar'
import type { CalendarEvent, CalendarDay } from '../types'
import AppLayout from '../components/layout/AppLayout'
import { Button } from '../components/ui/Button'
import { Card, CardContent } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Skeleton } from '../components/ui/Skeleton'

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-500',
  completed: 'bg-blue-500',
  on_hold: 'bg-yellow-500',
  cancelled: 'bg-red-500',
  scheduled: 'bg-purple-500',
}

const STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  completed: 'Completed',
  on_hold: 'On Hold',
  cancelled: 'Cancelled',
  scheduled: 'Scheduled',
}

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
          <h1 className="text-2xl font-bold">Calendar</h1>
          <div className="flex items-center gap-2">
            <div className="flex overflow-hidden rounded-lg border border-gray-200 text-xs mr-2">
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-3 py-1.5 transition-colors ${viewMode === 'calendar' ? 'bg-primary text-white' : 'bg-white text-muted-foreground hover:bg-gray-50'}`}
              >
                Calendar
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 transition-colors ${viewMode === 'list' ? 'bg-primary text-white' : 'bg-white text-muted-foreground hover:bg-gray-50'}`}
              >
                List
              </button>
            </div>
            <Button variant="outline" size="sm" onClick={prevMonth}>&larr;</Button>
            <Button variant="outline" size="sm" onClick={goToday}>Today</Button>
            <Button variant="outline" size="sm" onClick={nextMonth}>&rarr;</Button>
          </div>
        </div>

        <h2 className="mb-4 text-lg font-semibold">
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
                        <div key={`${e.id}-${e.type}`} className={`flex items-center justify-between rounded-lg px-3 py-2 ${e.type === 'site_visit' ? 'bg-purple-50' : isOverdue(e) ? 'bg-red-50' : 'bg-gray-50'}`}>
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
              <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
                {DAYS.map(d => (
                  <div key={d} className="px-2 py-2 text-center text-xs font-medium text-muted-foreground uppercase tracking-wide">{d}</div>
                ))}
              </div>
              {weeks.map((week, wi) => (
                <div key={wi} className="grid grid-cols-7 overflow-hidden border-b border-gray-100 last:border-0">
                  {week.map((day, di) => (
                    <button
                      key={di}
                      onClick={() => day.events.length > 0 && setSelectedDay(day)}
                      className={`min-h-[60px] p-1 sm:min-h-[90px] sm:p-1.5 border-r border-gray-100 last:border-0 text-left transition-colors hover:bg-gray-50 ${
                        !day.isCurrentMonth ? 'bg-gray-50/50' : ''
                      } ${day.isThisWeek ? 'ring-1 ring-inset ring-blue-200' : ''}`}
                    >
                      <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-medium sm:h-6 sm:w-6 sm:text-xs ${
                        day.isToday ? 'bg-blue-600 text-white' : day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                      }`}>
                        {day.day}
                      </span>
                      <div className="mt-1 space-y-0.5">
                        {day.events.slice(0, 3).map(e => (
                          <div
                            key={`${e.id}-${e.type}`}
                            className={`flex items-center gap-1 rounded px-1 py-0.5 text-[10px] font-medium leading-tight ${
                              isOverdue(e) ? 'bg-red-100 text-red-700' : e.type === 'site_visit' ? 'bg-purple-100 text-purple-700' : 'bg-blue-50 text-blue-700'
                            }`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${STATUS_COLORS[e.status] ?? 'bg-gray-400'}`} />
                            <span className="truncate">{e.name}</span>
                            {e.type === 'start' && <span className="shrink-0 opacity-60">S</span>}
                            {e.type === 'due' && <span className="shrink-0 opacity-60">D</span>}
                            {e.type === 'site_visit' && <span className="shrink-0 opacity-60 text-purple-600">V</span>}
                          </div>
                        ))}
                        {day.events.length > 3 && (
                          <p className="text-[10px] text-gray-400 pl-1">+{day.events.length - 3} more</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ))}
            </Card>

            {/* Legend */}
            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-500" /> Active</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-500" /> Completed</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-yellow-500" /> On Hold</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500" /> Cancelled</span>
              <span className="flex items-center gap-1"><Badge variant="destructive" className="rounded-sm px-1.5 py-0.5">Overdue</Badge></span>
              <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-full border-2 border-blue-200" /> This Week</span>
              <span className="flex items-center gap-1">S = Start &nbsp; D = Due</span>
            </div>
          </>
        )}

        {/* Day detail modal */}
        {selectedDay && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setSelectedDay(null)}>
            <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">
                  {selectedDay.date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </h2>
                <button onClick={() => setSelectedDay(null)} className="text-gray-400 hover:text-gray-600">&times;</button>
              </div>
              {selectedDay.events.length === 0 ? (
                <p className="text-sm text-muted-foreground">No events on this day.</p>
              ) : (
                <div className="space-y-2">
                  {selectedDay.events.map(e => (
                    <div key={`${e.id}-${e.type}`} className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
                      <div>
                        <p className="text-sm font-medium">{e.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {e.client_name ?? 'No client'} — {e.type === 'start' ? 'Start' : e.type === 'site_visit' ? 'Site Visit' : 'Due'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          e.status === 'active' ? 'success' :
                          e.status === 'completed' ? 'default' :
                          e.status === 'on_hold' ? 'warning' :
                          'destructive'
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
