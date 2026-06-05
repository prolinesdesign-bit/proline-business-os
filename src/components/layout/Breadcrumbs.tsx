import { useLocation, Link } from 'react-router-dom'
import { PAGE_LABELS, HomeIcon } from './Icons'

export default function Breadcrumbs() {
  const location = useLocation()
  const pathParts = location.pathname.split('/').filter(Boolean)

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-gray-500">
      <Link to="/dashboard" className="flex items-center gap-1 text-gray-400 hover:text-gray-600 transition-colors">
        <HomeIcon className="h-4 w-4" />
      </Link>
      {pathParts.length > 0 && (
        <span className="text-gray-300 select-none">/</span>
      )}
      {pathParts.map((part, i) => {
        const isLast = i === pathParts.length - 1
        const label = PAGE_LABELS[part] || part.charAt(0).toUpperCase() + part.slice(1).replace(/_/g, ' ')
        return (
          <span key={part} className="flex items-center gap-1.5">
            {isLast ? (
              <span className="font-medium text-gray-900">{label}</span>
            ) : (
              <>
                <Link
                  to={'/' + pathParts.slice(0, i + 1).join('/')}
                  className="hover:text-gray-700 transition-colors"
                >
                  {label}
                </Link>
                <span className="text-gray-300 select-none">/</span>
              </>
            )}
          </span>
        )
      })}
    </nav>
  )
}
