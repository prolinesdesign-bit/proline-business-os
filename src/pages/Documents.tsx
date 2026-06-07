import { useEffect, useState, useCallback, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getDocuments, uploadDocument, deleteDocument, getDocumentDownloadUrl } from '../lib/api/documents'
import { getProjects } from '../lib/api/projects'
import type { Document, Project } from '../types'
import AppLayout from '../components/layout/AppLayout'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Label } from '../components/ui/Label'

import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table'
import { toast } from 'sonner'
import { TableSkeleton } from '../components/ui/Skeleton'
import { EmptyState } from '../components/ui/EmptyState'

const FILE_ICONS: Record<string, string> = {
  'application/pdf': '📄',
  'image/jpeg': '🖼️',
  'image/png': '🖼️',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📝',
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function Documents() {
  const [searchParams] = useSearchParams()
  const projectIdParam = searchParams.get('project_id') || ''

  const [documents, setDocuments] = useState<Document[]>([])
  const [projects, setProjects] = useState<Pick<Project, 'id' | 'name'>[]>([])
  const [loading, setLoading] = useState(true)
  const [filterProject, setFilterProject] = useState(projectIdParam)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState<Document | null>(null)
  const [preview, setPreview] = useState<Document | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploadData, setUploadData] = useState({ project_id: projectIdParam, notes: '' })

  const fetchProjects = useCallback(async () => {
    try {
      const projs = await getProjects('')
      setProjects(projs)
    } catch (err) {
      console.error(err)
    }
  }, [])

  const fetchDocs = useCallback(async () => {
    setLoading(true)
    try {
      const docs = await getDocuments(filterProject || undefined)
      setDocuments(docs)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [filterProject])

  useEffect(() => { fetchProjects() }, [fetchProjects])
  useEffect(() => { fetchDocs() }, [fetchDocs])

  useEffect(() => {
    if (projectIdParam) {
      setFilterProject(projectIdParam)
      setUploadData(prev => ({ ...prev, project_id: projectIdParam }))
    }
  }, [projectIdParam])

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      await uploadDocument(file, uploadData.project_id || null, uploadData.notes)
      setUploadData({ project_id: '', notes: '' })
      if (fileRef.current) fileRef.current.value = ''
      fetchDocs()
      toast.success('Document uploaded')
    } catch (err) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function handlePreview(doc: Document) {
    try {
      const url = await getDocumentDownloadUrl(doc.storage_path)
      setPreview(doc)
      setPreviewUrl(url)
    } catch (err) {
      console.error(err)
    }
  }

  async function handleDownload(doc: Document) {
    try {
      const url = await getDocumentDownloadUrl(doc.storage_path)
      const a = document.createElement('a')
      a.href = url
      a.download = doc.name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch (err) {
      console.error(err)
    }
  }

  async function handleDelete() {
    if (!deleting) return
    try {
      await deleteDocument(deleting.id)
      setDeleting(null)
      fetchDocs()
      toast.success('Document deleted')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete document')
    }
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="flex items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold">Documents</h1>
        </div>

        {/* Upload card */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <h2 className="font-semibold mb-3">Upload Document</h2>
            <div className="grid gap-3 sm:grid-cols-3 mb-3">
              <div>
                <Label className="text-xs mb-1 block">Linked Project</Label>
                <Select
                  value={uploadData.project_id}
                  onChange={e => setUploadData(prev => ({ ...prev, project_id: e.target.value }))}
                >
                  <option value="">None</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label className="text-xs mb-1 block">Notes</Label>
                <Input
                  value={uploadData.notes}
                  onChange={e => setUploadData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Optional notes..."
                />
              </div>
              <div className="flex items-end">
                <Label className="flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover shadow-sm disabled:opacity-50">
                  {uploading ? 'Uploading...' : 'Choose File'}
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filter */}
        <div className="flex items-center gap-3 mb-4">
          <Label className="text-sm text-muted-foreground">Filter by project:</Label>
          <Select
            value={filterProject}
            onChange={e => setFilterProject(e.target.value)}
            className="w-auto"
          >
            <option value="">All Documents</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </Select>
        </div>

        {/* Document list */}
        {loading ? (
          <TableSkeleton />
        ) : documents.length === 0 ? (
          <EmptyState title="No documents yet" description="Upload your first document to get started." />
        ) : (
          <>
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map(doc => {
                    const project = projects.find(p => p.id === doc.project_id)
                    return (
                      <TableRow key={doc.id}>
                        <TableCell className="whitespace-nowrap">
                          <span className="flex items-center gap-2">
                            <span>{FILE_ICONS[doc.file_type] ?? '📎'}</span>
                            <span className="font-medium truncate max-w-[200px]">{doc.name}</span>
                          </span>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-muted-foreground text-xs">{doc.file_type.split('/').pop()?.toUpperCase()}</TableCell>
                        <TableCell className="whitespace-nowrap text-muted-foreground">{formatSize(doc.file_size)}</TableCell>
                        <TableCell className="whitespace-nowrap text-muted-foreground">{formatDate(doc.created_at)}</TableCell>
                        <TableCell className="whitespace-nowrap text-muted-foreground">{project?.name ?? '—'}</TableCell>
                        <TableCell className="max-w-[150px] truncate text-muted-foreground">{doc.notes ?? '—'}</TableCell>
                        <TableCell className="whitespace-nowrap text-right">
                          <Button variant="link" size="sm" onClick={() => handlePreview(doc)}>Preview</Button>
                          <Button variant="link" size="sm" className="ml-3 text-green-600" onClick={() => handleDownload(doc)}>Download</Button>
                          <Button variant="link" size="sm" className="ml-3 text-destructive" onClick={() => setDeleting(doc)}>Delete</Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Mobile card view */}
            <div className="space-y-3 md:hidden">
              {documents.map((doc) => {
                const project = projects.find(p => p.id === doc.project_id)
                return (
                  <Card key={doc.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">{doc.name}</p>
                          <p className="text-xs text-muted-foreground">{doc.file_type.split('/').pop()?.toUpperCase()} · {formatSize(doc.file_size)}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(doc.created_at)}{project ? ` · ${project.name}` : ''}</p>
                          {doc.notes && <p className="mt-1 text-xs text-muted-foreground truncate">{doc.notes}</p>}
                        </div>
                        <div className="flex gap-1 ml-3">
                          <button onClick={() => handlePreview(doc)} className="text-xs text-blue-600 hover:underline">View</button>
                          <button onClick={() => setDeleting(doc)} className="text-xs text-red-600 hover:underline">Del</button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </>
        )}
      </div>

      {preview && previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="flex w-full max-w-4xl flex-col rounded-xl bg-card shadow-xl" style={{ maxHeight: '90vh' }}>
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h2 className="font-semibold truncate">{preview.name}</h2>
              <button onClick={() => { setPreview(null); setPreviewUrl(null) }} className="text-2xl leading-none text-muted-foreground hover:text-foreground">&times;</button>
            </div>
            <div className="flex-1 overflow-auto p-2">
              {preview.file_type === 'application/pdf' ? (
                <iframe src={previewUrl} className="h-full w-full" style={{ minHeight: '70vh' }} title={preview.name} />
              ) : preview.file_type.startsWith('image/') ? (
                <img src={previewUrl} alt={preview.name} className="mx-auto max-h-[75vh] object-contain" />
              ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <span className="text-5xl mb-4">{FILE_ICONS[preview.file_type] ?? '📎'}</span>
                    <p className="mb-1 font-medium">{preview.name}</p>
                    <p className="text-sm">Preview not available for this file type.</p>
                    <Button onClick={() => handleDownload(preview)} className="mt-4">
                      Download
                    </Button>
                  </div>
              )}
            </div>
          </div>
        </div>
      )}

      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-sm">
            <CardHeader>
              <CardTitle>Delete Document</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Delete <strong>{deleting.name}</strong>? This cannot be undone.
              </p>
              <div className="mt-5 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button>
                <Button variant="destructive" onClick={handleDelete}>Delete</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </AppLayout>
  )
}
