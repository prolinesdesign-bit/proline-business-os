import { Link } from 'react-router-dom'
import type { Project } from '../../types'

const stageColors: Record<Project['status'], string> = {
  active: 'bg-green-100 text-green-800',
  completed: 'bg-blue-100 text-blue-800',
  on_hold: 'bg-yellow-100 text-yellow-800',
  cancelled: 'bg-red-100 text-red-800',
}

interface Props {
  project: Project
  docCount?: number
  onEdit: (project: Project) => void
  onDelete: (project: Project) => void
}

export default function ProjectCard({ project, docCount = 0, onEdit, onDelete }: Props) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold">{project.name}</h3>
          {project.client_name && (
            <p className="mt-0.5 text-sm text-gray-500">{project.client_name}</p>
          )}
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${stageColors[project.status]}`}
        >
          {project.status.replace('_', ' ')}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
        {project.budget != null && (
          <span>₹{Number(project.budget).toLocaleString()}</span>
        )}
        {project.start_date && <span>Start: {project.start_date}</span>}
        {project.end_date && <span>Due: {project.end_date}</span>}
        {docCount > 0 && <span>📄 {docCount} document{docCount !== 1 ? 's' : ''}</span>}
      </div>

      {project.description && (
        <p className="mt-2 line-clamp-2 text-sm text-gray-500">{project.description}</p>
      )}

      <div className="mt-3 flex gap-2 border-t border-gray-100 pt-3">
        <button
          onClick={() => onEdit(project)}
          className="text-sm text-blue-600 hover:underline"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(project)}
          className="text-sm text-red-600 hover:underline"
        >
          Delete
        </button>
        <Link
          to={`/documents`}
          className="text-sm text-blue-600 hover:underline ml-auto"
        >
          {docCount > 0 ? 'Documents' : 'Add Docs'}
        </Link>
      </div>
    </div>
  )
}
