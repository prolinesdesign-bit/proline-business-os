import { useEffect, useState, useCallback, useRef } from 'react'
import { getSiteVisits, createSiteVisit, updateSiteVisit, deleteSiteVisit, uploadSitePhoto, deleteSitePhoto } from '../lib/api/sitevisits'
import type { SiteVisit, SiteVisitFormData, SiteVisitWithRelations, SiteVisitStatus } from '../types'
import SiteVisitForm from '../components/sitevisits/SiteVisitForm'
import AppLayout from '../components/layout/AppLayout'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { toast } from 'sonner'
import { CardSkeleton } from '../components/ui/Skeleton'
import { EmptyState } from '../components/ui/EmptyState'

const statusBadge: Record<SiteVisitStatus, 'warning' | 'default' | 'success' | 'destructive'> = {
  pending: 'warning',
  in_progress: 'default',
  completed: 'success',
  cancelled: 'destructive',
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function fmtCost(n: number) {
  return `₹${Math.round(n).toLocaleString()}`
}

export default function SiteVisits() {
  const [visits, setVisits] = useState<SiteVisitWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<SiteVisit | null>(null)
  const [deleting, setDeleting] = useState<SiteVisitWithRelations | null>(null)
  const [uploading, setUploading] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadTarget, setUploadTarget] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getSiteVisits()
      setVisits(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  async function handleSave(data: SiteVisitFormData) {
    try {
      if (editing) {
        await updateSiteVisit(editing.id, data)
      } else {
        await createSiteVisit(data)
      }
      setShowForm(false)
      setEditing(null)
      fetch()
      toast.success('Site visit saved')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save site visit')
    }
  }

  async function handleDelete() {
    if (!deleting) return
    try {
      await deleteSiteVisit(deleting.id)
      setDeleting(null)
      fetch()
      toast.success('Site visit deleted')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete site visit')
    }
  }

  async function handleFileSelect(siteVisitId: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(siteVisitId)
    try {
      await uploadSitePhoto(siteVisitId, file)
      fetch()
    } catch (err) {
      console.error('Photo upload failed:', err)
    } finally {
      setUploading(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      setUploadTarget(null)
    }
  }

  async function handleDeletePhoto(siteVisitId: string, url: string) {
    try {
      await deleteSitePhoto(siteVisitId, url)
      fetch()
    } catch (err) {
      console.error('Photo delete failed:', err)
    }
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="flex items-center justify-between gap-4 mb-6">
          <h1 className="font-display text-3xl tracking-tight">Site Visits</h1>
          <Button onClick={() => setShowForm(true)}>
            + New Site Visit
          </Button>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2"><CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>
        ) : visits.length === 0 ? (
          <EmptyState title="No site visits yet" description="Record your first site visit to start tracking." />
        ) : (
          <div className="space-y-3">
            {visits.map(sv => (
              <Card key={sv.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{sv.location || 'No location'}</span>
                        <Badge variant={statusBadge[sv.site_status]}>
                          {sv.site_status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span>Date: {formatDate(sv.visit_date)}</span>
                        {sv.project_name && <span>Project: {sv.project_name}</span>}
                        {sv.client_name && <span>Client: {sv.client_name}</span>}
                        {sv.travel_cost > 0 && <span>Travel: {fmtCost(sv.travel_cost)}</span>}
                      </div>
                      {sv.notes && <p className="mt-1 text-sm text-muted-foreground">{sv.notes}</p>}
                      {sv.next_action && (
                        <p className="mt-1 text-sm">
                          <span className="font-medium text-muted-foreground">Next: </span>
                          <span className="text-muted-foreground">{sv.next_action}</span>
                        </p>
                      )}
                      {sv.latitude != null && sv.longitude != null && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {sv.latitude.toFixed(6)}, {sv.longitude.toFixed(6)}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      {sv.latitude != null && sv.longitude != null && (
                        <Button
                          variant="success"
                          size="sm"
                          asChild
                        >
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${sv.latitude},${sv.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Navigate
                          </a>
                        </Button>
                      )}
                      <Button variant="link" size="sm" onClick={() => { setEditing(sv); setShowForm(true) }}>Edit</Button>
                      <Button variant="link" size="sm" className="text-destructive" onClick={() => setDeleting(sv)}>Delete</Button>
                    </div>
                  </div>

                  {/* Photos */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-muted-foreground">Photos ({sv.photo_urls.length})</span>
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => { setUploadTarget(sv.id); setTimeout(() => fileInputRef.current?.click(), 0) }}
                        disabled={uploading === sv.id}
                      >
                        {uploading === sv.id ? 'Uploading...' : 'Add Photo'}
                      </Button>
                    </div>
                  {sv.photo_urls.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {sv.photo_urls.map((url, i) => (
                        <div key={i} className="group relative">
                          <button
                            onClick={() => setPreviewUrl(url)}
                            className="block h-20 w-20 overflow-hidden rounded-lg border border-border"
                          >
                            <img src={url} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
                          </button>
                          <button
                            onClick={() => handleDeletePhoto(sv.id, url)}
                            className="absolute -right-1.5 -top-1.5 hidden h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs text-white group-hover:flex"
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => uploadTarget && handleFileSelect(uploadTarget, e)}
      />

      {showForm && (
        <SiteVisitForm
          siteVisit={editing}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditing(null) }}
        />
      )}

      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-sm">
            <CardHeader>
              <CardTitle>Delete Site Visit</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Delete site visit at <strong>{deleting.location || 'unknown location'}</strong>? This cannot be undone.
              </p>
              <div className="mt-5 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button>
                <Button variant="destructive" onClick={handleDelete}>Delete</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setPreviewUrl(null)}>
          <div className="relative max-h-[90vh] max-w-[90vw]" onClick={e => e.stopPropagation()}>
            <button onClick={() => setPreviewUrl(null)} className="absolute -right-3 -top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white text-lg shadow-lg">&times;</button>
            <img src={previewUrl} alt="Site visit photo" className="max-h-[85vh] max-w-[85vw] rounded-lg object-contain" />
          </div>
        </div>
      )}
    </AppLayout>
  )
}
