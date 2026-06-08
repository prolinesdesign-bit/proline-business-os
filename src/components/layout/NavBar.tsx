import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  NAV_ICONS, CloseIcon, LogoutIcon,
} from './Icons'

interface Props {
  open: boolean
  onClose: () => void
}

const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { key: 'dashboard', label: 'Dashboard', path: '/dashboard' },
      { key: 'analytics', label: 'Analytics', path: '/analytics' },
    ],
  },
  {
    label: 'Projects',
    items: [
      { key: 'projects', label: 'Projects', path: '/projects' },
      { key: 'calendar', label: 'Calendar', path: '/calendar' },
    ],
  },
  {
    label: 'Clients',
    items: [
      { key: 'clients', label: 'Clients', path: '/clients' },
      { key: 'followups', label: 'Follow-ups', path: '/followups' },
    ],
  },
  {
    label: 'Financial',
    items: [
      { key: 'payments', label: 'Payments', path: '/payments' },
      { key: 'expenses', label: 'Expenses', path: '/expenses' },
      { key: 'targets', label: 'Targets', path: '/targets' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { key: 'tasks', label: 'Tasks', path: '/tasks' },
      { key: 'documents', label: 'Documents', path: '/documents' },
      { key: 'sitevisits', label: 'Site Visits', path: '/sitevisits' },
      { key: 'proposals', label: 'Proposals', path: '/proposals' },
    ],
  },
  {
    label: 'System',
    items: [
      { key: 'backup', label: 'Backup', path: '/backup' },
    ],
  },
]

export default function NavBar({ open, onClose }: Props) {
  const { signOut } = useAuth()
  const location = useLocation()

  function isActive(path: string) {
    return location.pathname === path
  }

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-border bg-card transition-transform duration-200 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-border bg-gradient-to-r from-primary/5 to-transparent px-4">
          <Link to="/dashboard" className="flex items-center">
            <img src="/logo.png" alt="Proline" className="h-8 w-auto object-contain dark:brightness-0 dark:invert" />
          </Link>
          <button onClick={onClose} className="rounded-lg p-1 text-muted-foreground hover:bg-accent lg:hidden">
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {NAV_GROUPS.map(group => (
            <div key={group.label} className="mb-4 last:mb-0">
              <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                {group.label}
              </p>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = NAV_ICONS[item.key]
                  const active = isActive(item.path)
                  return (
                    <li key={item.key}>
                      <Link
                        to={item.path}
                        onClick={onClose}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                          active
                            ? 'bg-primary-light text-primary shadow-sm'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        }`}
                      >
                        <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-primary' : ''}`} />
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-border p-3">
          <button
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <LogoutIcon className="h-4 w-4 shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  )
}
