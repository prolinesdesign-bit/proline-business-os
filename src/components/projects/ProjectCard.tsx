import { Link } from 'react-router-dom'
import type { Project } from '../../types'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { Card, CardContent } from '../ui/Card'

interface Props {
  project: Project
  docCount?: number
  siteVisitPhotoCount?: number
  onEdit: (project: Project) => void
  onDelete: (project: Project) => void
}

export default function ProjectCard({ project, docCount = 0, siteVisitPhotoCount = 0, onEdit, onDelete }: Props) {
  return (
    <Card>
      <CardContent className="p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold">{project.name}</h3>
          {project.client_name && (
            <p className="mt-0.5 text-sm text-muted-foreground">{project.client_name}</p>
          )}
        </div>
        <Badge variant={
          project.status === 'final_render' || project.status === 'balance_paid' || project.status === 'delivered' || project.status === 'completed' ? 'default' :
          project.status === 'advance_paid' || project.status === 'active' ? 'success' :
          project.status === 'on_hold' ? 'warning' :
          'secondary'
        }>
          {project.status.replace('_', ' ')}
        </Badge>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
        {project.budget != null && (
          <span>₹{Number(project.budget).toLocaleString()}</span>
        )}
        {project.start_date && <span>Start: {project.start_date}</span>}
        {project.end_date && <span>Due: {project.end_date}</span>}
        {docCount > 0 && <span>📄 {docCount} document{docCount !== 1 ? 's' : ''}</span>}
        {siteVisitPhotoCount > 0 && <span>📷 {siteVisitPhotoCount} photo{siteVisitPhotoCount !== 1 ? 's' : ''}</span>}
      </div>

      {project.description && (
        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{project.description}</p>
      )}

      <div className="mt-3 flex gap-2 border-t border-border pt-3">
        <Button
          type="button"
          variant="link"
          size="sm"
          onClick={() => onEdit(project)}
        >
          Edit
        </Button>
        <Button
          type="button"
          variant="link"
          size="sm"
          className="text-destructive"
          onClick={() => onDelete(project)}
        >
          Delete
        </Button>
        <Link
          to={`/documents`}
          className="text-sm text-blue-600 hover:underline ml-auto"
        >
          {docCount > 0 ? 'Documents' : 'Add Docs'}
        </Link>
      </div>
    </CardContent>
    </Card>
  )
}
