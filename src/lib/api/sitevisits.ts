import { supabase } from '../supabase'
import type { SiteVisit, SiteVisitFormData, SiteVisitWithRelations } from '../../types'

export async function getSiteVisits(): Promise<SiteVisitWithRelations[]> {
  const { data, error } = await supabase
    .from('site_visits')
    .select('*, projects(name), clients(name)')
    .order('visit_date', { ascending: false })

  if (error) throw error

  return (data ?? []).map((sv: Record<string, unknown>) => ({
    id: sv.id as string,
    created_at: sv.created_at as string,
    updated_at: sv.updated_at as string,
    user_id: sv.user_id as string,
    project_id: sv.project_id as string | null,
    client_id: sv.client_id as string | null,
    visit_date: sv.visit_date as string,
    location: sv.location as string | null,
    notes: sv.notes as string | null,
    travel_cost: Number(sv.travel_cost),
    site_status: sv.site_status as SiteVisit['site_status'],
    next_action: sv.next_action as string | null,
    photo_urls: (sv.photo_urls as string[]) ?? [],
    latitude: sv.latitude != null ? Number(sv.latitude) : null,
    longitude: sv.longitude != null ? Number(sv.longitude) : null,
    project_name: (sv.projects as Record<string, unknown> | null)?.name as string | null,
    client_name: (sv.clients as Record<string, unknown> | null)?.name as string | null,
  }))
}

export async function createSiteVisit(data: SiteVisitFormData): Promise<SiteVisit> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: sv, error } = await supabase
    .from('site_visits')
    .insert({
      user_id: user.id,
      project_id: data.project_id || null,
      client_id: data.client_id || null,
      visit_date: data.visit_date,
      location: data.location || null,
      notes: data.notes || null,
      travel_cost: data.travel_cost ? Number(data.travel_cost) : 0,
      site_status: data.site_status,
      next_action: data.next_action || null,
      latitude: data.latitude ? Number(data.latitude) : null,
      longitude: data.longitude ? Number(data.longitude) : null,
    })
    .select()
    .single()

  if (error) throw error
  return sv
}

export async function updateSiteVisit(id: string, data: SiteVisitFormData): Promise<SiteVisit> {
  const { data: sv, error } = await supabase
    .from('site_visits')
    .update({
      project_id: data.project_id || null,
      client_id: data.client_id || null,
      visit_date: data.visit_date,
      location: data.location || null,
      notes: data.notes || null,
      travel_cost: data.travel_cost ? Number(data.travel_cost) : 0,
      site_status: data.site_status,
      next_action: data.next_action || null,
      latitude: data.latitude ? Number(data.latitude) : null,
      longitude: data.longitude ? Number(data.longitude) : null,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return sv
}

export async function deleteSiteVisit(id: string): Promise<void> {
  const { data: sv, error: fetchError } = await supabase
    .from('site_visits')
    .select('photo_urls')
    .eq('id', id)
    .single()
  if (fetchError) throw fetchError

  const paths = (sv.photo_urls as string[]) ?? []
  if (paths.length > 0) {
    await supabase.storage.from('site_photos').remove(paths)
  }

  const { error } = await supabase.from('site_visits').delete().eq('id', id)
  if (error) throw error
}

export async function uploadSitePhoto(
  siteVisitId: string,
  file: File,
): Promise<string[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const fileExt = file.name.split('.').pop()
  const storagePath = `${user.id}/${crypto.randomUUID()}.${fileExt}`

  const { error: uploadError } = await supabase.storage
    .from('site_photos')
    .upload(storagePath, file)

  if (uploadError) throw uploadError

  const { data: signedUrlData, error: signedUrlError } = await supabase.storage
    .from('site_photos')
    .createSignedUrl(storagePath, 86400)

  if (signedUrlError) {
    await supabase.storage.from('site_photos').remove([storagePath])
    throw signedUrlError
  }

  const { data: sv, error: fetchError } = await supabase
    .from('site_visits')
    .select('photo_urls')
    .eq('id', siteVisitId)
    .single()
  if (fetchError) {
    await supabase.storage.from('site_photos').remove([storagePath])
    throw fetchError
  }

  const existing = (sv.photo_urls as string[]) ?? []
  const updated = [...existing, signedUrlData.signedUrl]

  const { error: updateError } = await supabase
    .from('site_visits')
    .update({ photo_urls: updated })
    .eq('id', siteVisitId)

  if (updateError) {
    await supabase.storage.from('site_photos').remove([storagePath])
    throw updateError
  }

  return updated
}

export async function deleteSitePhoto(siteVisitId: string, url: string): Promise<string[]> {
  const { data: sv, error: fetchError } = await supabase
    .from('site_visits')
    .select('photo_urls')
    .eq('id', siteVisitId)
    .single()
  if (fetchError) throw fetchError

  const existing = (sv.photo_urls as string[]) ?? []
  const remaining = existing.filter(u => u !== url)

  const { error: updateError } = await supabase
    .from('site_visits')
    .update({ photo_urls: remaining })
    .eq('id', siteVisitId)
  if (updateError) throw updateError

  return remaining
}

export async function refreshSitePhotoUrls(paths: string[]): Promise<string[]> {
  return Promise.all(
    paths.map(async (p) => {
      if (p.startsWith('http')) return p
      const { data } = await supabase.storage
        .from('site_photos')
        .createSignedUrl(p, 86400)
      return data?.signedUrl ?? p
    }),
  )
}

export async function getSiteVisitCalendarEvents(): Promise<{ id: string; name: string; client_name: string | null; date: string }[]> {
  const { data, error } = await supabase
    .from('site_visits')
    .select('id, visit_date, location, clients(name)')

  if (error) throw error

  return (data ?? []).map((sv: Record<string, unknown>) => ({
    id: `sv-${sv.id}`,
    name: `Site Visit: ${(sv.location as string) ?? 'Unknown'}`,
    client_name: (sv.clients as Record<string, unknown> | null)?.name as string | null,
    date: sv.visit_date as string,
  }))
}
