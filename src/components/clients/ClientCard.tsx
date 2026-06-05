import type { Client, ClientStats } from '../../types'

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
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold">{client.name}</h3>
          {client.company && (
            <p className="mt-0.5 text-sm text-gray-500">{client.company}</p>
          )}
        </div>
      </div>

      <div className="mt-2 space-y-1 text-sm text-gray-600">
        {client.email && <p>✉ {client.email}</p>}
        {client.phone && <p>📞 {client.phone}</p>}
        {client.whatsapp && <p>💬 {client.whatsapp}</p>}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
        <span className="font-medium text-blue-700">
          {stats.project_count} project{stats.project_count !== 1 ? 's' : ''}
        </span>
        {stats.total_value > 0 && (
          <span className="font-medium text-green-700">
            ${stats.total_value.toLocaleString()}
          </span>
        )}
        {lastUpdated && (
          <span className="text-gray-400">Updated {lastUpdated}</span>
        )}
      </div>

      {client.notes && (
        <p className="mt-2 line-clamp-2 text-sm text-gray-500">{client.notes}</p>
      )}

      <div className="mt-3 flex gap-2 border-t border-gray-100 pt-3">
        <button onClick={() => onEdit(client)} className="text-sm text-blue-600 hover:underline">Edit</button>
        <button onClick={() => onDelete(client)} className="text-sm text-red-600 hover:underline">Delete</button>
      </div>
    </div>
  )
}
