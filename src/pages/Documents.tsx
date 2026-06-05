import { useEffect, useState, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getDocuments, uploadDocument, deleteDocument, getDocumentDownloadUrl } from '../lib/api/documents'
import { getProjects } from '../lib/api/projects'
import type { Document, Project } from '../types'

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
  const { signOut } = useAuth()
  const [documents, setDocuments] = useState<Document[]>([])
  const [projects, setProjects] = useState<Pick<Project, 'id' | 'name'>[]>([])
  const [loading, setLoading] = useState(true)
  const [filterProject, setFilterProject] = useState('')
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState<Document | null>(null)
  const [preview, setPreview] = useState<Document | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploadData, setUploadData] = useState({ project_id: '', notes: '' })

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

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      await uploadDocument(file, uploadData.project_id || null, uploadData.notes)
      setUploadData({ project_id: '', notes: '' })
      if (fileRef.current) fileRef.current.value = ''
      fetchDocs()
    } catch (err) {
      console.error(err)
      alert(err instanceof Error ? err.message : 'Upload failed')
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
    } catch (err) {
      console.error(err)
    }
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
          <button onClick={signOut} className="rounded-lg border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50">Logout</button>
        </nav>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="flex items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold">Documents</h1>
        </div>

        {/* Upload card */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm mb-6">
          <h2 className="font-semibold mb-3">Upload Document</h2>
          <div className="grid gap-3 sm:grid-cols-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Linked Project</label>
              <select
                value={uploadData.project_id}
                onChange={e => setUploadData(prev => ({ ...prev, project_id: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="">None</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
              <input
                value={uploadData.notes}
                onChange={e => setUploadData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Optional notes..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="flex items-end">
              <label className="flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
                {uploading ? 'Uploading...' : 'Choose File'}
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-3 mb-4">
          <label className="text-sm text-gray-600">Filter by project:</label>
          <select
            value={filterProject}
            onChange={e => setFilterProject(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="">All Documents</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Document list */}
        {loading ? (
          <p className="text-center text-gray-500 py-12">Loading...</p>
        ) : documents.length === 0 ? (
          <p className="text-center text-gray-500 py-12">No documents uploaded yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-4 py-3 font-medium text-gray-600">File</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Type</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Size</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Uploaded</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Project</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Notes</th>
                  <th className="px-4 py-3 font-medium text-gray-600" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {documents.map(doc => {
                  const project = projects.find(p => p.id === doc.project_id)
                  return (
                    <tr key={doc.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="flex items-center gap-2">
                          <span>{FILE_ICONS[doc.file_type] ?? '📎'}</span>
                          <span className="font-medium truncate max-w-[200px]">{doc.name}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-500 text-xs">{doc.file_type.split('/').pop()?.toUpperCase()}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-500">{formatSize(doc.file_size)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-500">{formatDate(doc.created_at)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-500">{project?.name ?? '—'}</td>
                      <td className="px-4 py-3 max-w-[150px] truncate text-gray-500">{doc.notes ?? '—'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <button onClick={() => handlePreview(doc)} className="text-sm text-blue-600 hover:underline">Preview</button>
                        <button onClick={() => handleDownload(doc)} className="ml-3 text-sm text-green-600 hover:underline">Download</button>
                        <button onClick={() => setDeleting(doc)} className="ml-3 text-sm text-red-600 hover:underline">Delete</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {preview && previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="flex w-full max-w-4xl flex-col rounded-xl bg-white shadow-xl" style={{ maxHeight: '90vh' }}>
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
              <h2 className="font-semibold truncate">{preview.name}</h2>
              <button onClick={() => { setPreview(null); setPreviewUrl(null) }} className="text-2xl leading-none text-gray-500 hover:text-gray-700">&times;</button>
            </div>
            <div className="flex-1 overflow-auto p-2">
              {preview.file_type === 'application/pdf' ? (
                <iframe src={previewUrl} className="h-full w-full" style={{ minHeight: '70vh' }} title={preview.name} />
              ) : preview.file_type.startsWith('image/') ? (
                <img src={previewUrl} alt={preview.name} className="mx-auto max-h-[75vh] object-contain" />
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                  <span className="text-5xl mb-4">{FILE_ICONS[preview.file_type] ?? '📎'}</span>
                  <p className="mb-1 font-medium">{preview.name}</p>
                  <p className="text-sm">Preview not available for this file type.</p>
                  <button onClick={() => handleDownload(preview)} className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                    Download
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold">Delete Document</h2>
            <p className="mt-2 text-sm text-gray-600">
              Delete <strong>{deleting.name}</strong>? This cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setDeleting(null)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={handleDelete} className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
