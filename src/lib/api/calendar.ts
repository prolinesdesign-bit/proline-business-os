import { supabase } from '../supabase'
import type { CalendarEvent } from '../../types'

export async function getCalendarEvents(): Promise<CalendarEvent[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('id, name, client_name, status, start_date, end_date')

  if (error) throw error

  const events: CalendarEvent[] = []

  for (const p of data ?? []) {
    if (p.start_date) {
      events.push({
        id: p.id,
        name: p.name,
        client_name: p.client_name,
        status: p.status,
        type: 'start',
        date: p.start_date,
      })
    }
    if (p.end_date) {
      events.push({
        id: p.id,
        name: p.name,
        client_name: p.client_name,
        status: p.status,
        type: 'due',
        date: p.end_date,
      })
    }
  }

  return events.sort((a, b) => a.date.localeCompare(b.date))
}
