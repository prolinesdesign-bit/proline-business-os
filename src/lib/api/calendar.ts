import { supabase } from '../supabase'
import type { CalendarEvent } from '../../types'

export async function getCalendarEvents(): Promise<CalendarEvent[]> {
  const [projectsRes, siteVisitsRes] = await Promise.all([
    supabase
      .from('projects')
      .select('id, name, client_name, status, start_date, end_date'),
    supabase
      .from('site_visits')
      .select('id, visit_date, location, clients(name)'),
  ])

  if (projectsRes.error) throw projectsRes.error
  if (siteVisitsRes.error) throw siteVisitsRes.error

  const events: CalendarEvent[] = []

  for (const p of projectsRes.data ?? []) {
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

  for (const sv of (siteVisitsRes.data ?? []) as Record<string, unknown>[]) {
    const clientInfo = (sv.clients as Record<string, unknown> | null)
    events.push({
      id: `sv-${sv.id as string}`,
      name: `Site Visit: ${(sv.location as string | null) ?? 'Unknown'}`,
      client_name: (clientInfo?.name as string | null) ?? null,
      status: 'scheduled',
      type: 'site_visit',
      date: sv.visit_date as string,
    })
  }

  return events.sort((a, b) => a.date.localeCompare(b.date))
}
