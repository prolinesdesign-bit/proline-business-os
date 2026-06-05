import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getCalendarEvents } from '../lib/api/calendar'
import type { CalendarEvent, CalendarDay } from '../types'

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-500',
  completed: 'bg-blue-500',
  on_hold: 'bg-yellow-500',
  cancelled: 'bg-red-500',
}

const STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  completed: 'Completed',
  on_hold: 'On Hold',
  cancelled: 'Cancelled',
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
  const { signOut } = useAuth()
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth())
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null)

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
    <div className="min-h-screen bg-gray-50">
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
        <Link to="/" className="text-xl font-bold">Proline V1</Link>
        <nav className="flex items-center gap-4">
          <Link to="/projects" className="text-sm text-blue-600 hover:underline">Projects</Link>
          <Link to="/clients" className="text-sm text-blue-600 hover:underline">Clients</Link>
          <Link to="/payments" className="text-sm text-blue-600 hover:underline">Payments</Link>
          <Link to="/expenses" className="text-sm text-blue-600 hover:underline">Expenses</Link>
          <Link to="/targets" className="text-sm text-blue-600 hover:underline">Targets</Link>
          <Link to="/tasks" className="text-sm text-blue-600 hover:underline">Tasks</Link>
          <Link to="/calendar" className="text-sm text-blue-600 hover:underline">Calendar</Link>
          <Link to="/documents" className="text-sm text-blue-600 hover:underline">Documents</Link>
          <Link to="/followups" className="text-sm text-blue-600 hover:underline">Follow-ups</Link>
          <button onClick={signOut} className="rounded-lg border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50">Logout</button>
        </nav>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Calendar</h1>
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50">&larr;</button>
            <button onClick={goToday} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50">Today</button>
            <button onClick={nextMonth} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50">&rarr;</button>
          </div>
        </div>

        <h2 className="mb-4 text-lg font-semibold">
          {new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h2>

        {loading ? (
          <p className="text-center text-gray-500">Loading...</p>
        ) : (
          <>
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
                {DAYS.map(d => (
                  <div key={d} className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wide">{d}</div>
                ))}
              </div>
              {weeks.map((week, wi) => (
                <div key={wi} className="grid grid-cols-7 border-b border-gray-100 last:border-0">
                  {week.map((day, di) => (
                    <button
                      key={di}
                      onClick={() => day.events.length > 0 && setSelectedDay(day)}
                      className={`min-h-[90px] border-r border-gray-100 last:border-0 p-1.5 text-left transition-colors hover:bg-gray-50 ${
                        !day.isCurrentMonth ? 'bg-gray-50/50' : ''
                      } ${day.isThisWeek ? 'ring-1 ring-inset ring-blue-200' : ''}`}
                    >
                      <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                        day.isToday ? 'bg-blue-600 text-white' : day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                      }`}>
                        {day.day}
                      </span>
                      <div className="mt-1 space-y-0.5">
                        {day.events.slice(0, 3).map(e => (
                          <div
                            key={`${e.id}-${e.type}`}
                            className={`flex items-center gap-1 rounded px-1 py-0.5 text-[10px] font-medium leading-tight ${
                              isOverdue(e) ? 'bg-red-100 text-red-700' : 'bg-blue-50 text-blue-700'
                            }`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${STATUS_COLORS[e.status] ?? 'bg-gray-400'}`} />
                            <span className="truncate">{e.name}</span>
                            {e.type === 'start' && <span className="shrink-0 opacity-60">S</span>}
                            {e.type === 'due' && <span className="shrink-0 opacity-60">D</span>}
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
            </div>

            {/* Legend */}
            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-500" /> Active</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-500" /> Completed</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-yellow-500" /> On Hold</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500" /> Cancelled</span>
              <span className="flex items-center gap-1"><span className="rounded-sm bg-red-100 px-1.5 py-0.5 text-red-700">Overdue</span></span>
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
                <p className="text-sm text-gray-500">No events on this day.</p>
              ) : (
                <div className="space-y-2">
                  {selectedDay.events.map(e => (
                    <div key={`${e.id}-${e.type}`} className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
                      <div>
                        <p className="text-sm font-medium">{e.name}</p>
                        <p className="text-xs text-gray-500">{e.client_name ?? 'No client'} — {e.type === 'start' ? 'Start' : 'Due'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          e.status === 'active' ? 'bg-green-100 text-green-700' :
                          e.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                          e.status === 'on_hold' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {STATUS_LABELS[e.status] ?? e.status}
                        </span>
                        <Link to={`/projects`} className="text-xs text-blue-600 hover:underline">View</Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
