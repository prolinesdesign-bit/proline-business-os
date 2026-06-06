import type { Client, ClientStats } from '../../types'
import { Button } from '../ui/Button'
import { Card, CardContent } from '../ui/Card'

interface Props {
  client: Client
  stats: ClientStats
  onEdit: (client: Client) => void
  onDelete: (client: Client) => void
}

export default function ClientCard({ client, stats, onEdit, onDelete }: Props) {
  const lastUpdated = client.updated_at
    ? new Date(client.updated_at).toLocaleDateString()
    : null

  return (
    <Card>
      <CardContent className="p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold">{client.name}</h3>
          {client.company && (
            <p className="mt-0.5 text-sm text-muted-foreground">{client.company}</p>
          )}
        </div>
      </div>

      <div className="mt-2 space-y-1 text-sm text-muted-foreground">
        {client.email && <p>✉ {client.email}</p>}
        {client.phone && <p>📞 {client.phone}</p>}
        {client.source && <p className="text-xs text-muted-foreground">Source: {client.source}</p>}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
        <span className="font-medium text-blue-700">
          {stats.project_count} project{stats.project_count !== 1 ? 's' : ''}
        </span>
        {stats.total_value > 0 && (
          <span className="font-medium text-green-700">
            ₹{stats.total_value.toLocaleString()}
          </span>
        )}
        {lastUpdated && (
          <span className="text-muted-foreground">Updated {lastUpdated}</span>
        )}
      </div>

      {client.notes && (
        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{client.notes}</p>
      )}

      <div className="mt-3 flex gap-2 border-t border-border pt-3">
        <Button type="button" variant="link" size="sm" onClick={() => onEdit(client)}>Edit</Button>
        <Button type="button" variant="link" size="sm" className="text-destructive" onClick={() => onDelete(client)}>Delete</Button>
      </div>
    </CardContent>
    </Card>
  )
}
