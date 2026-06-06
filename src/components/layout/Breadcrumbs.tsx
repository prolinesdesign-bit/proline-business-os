import { useLocation, Link } from 'react-router-dom'
import { PAGE_LABELS, HomeIcon } from './Icons'

export default function Breadcrumbs() {
  const location = useLocation()
  const pathParts = location.pathname.split('/').filter(Boolean)

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground">
      <Link to="/dashboard" className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
        <HomeIcon className="h-4 w-4" />
      </Link>
      {pathParts.length > 0 && (
        <span className="text-border select-none">/</span>
      )}
      {pathParts.map((part, i) => {
        const isLast = i === pathParts.length - 1
        const label = PAGE_LABELS[part] || part.charAt(0).toUpperCase() + part.slice(1).replace(/_/g, ' ')
        return (
          <span key={part} className="flex items-center gap-1.5">
            {isLast ? (
              <span className="font-medium text-foreground">{label}</span>
            ) : (
              <>
                <Link
                  to={'/' + pathParts.slice(0, i + 1).join('/')}
                  className="hover:text-foreground transition-colors"
                >
                  {label}
                </Link>
                <span className="text-border select-none">/</span>
              </>
            )}
          </span>
        )
      })}
    </nav>
  )
}
