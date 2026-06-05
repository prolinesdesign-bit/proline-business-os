import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  NAV_ITEMS, NAV_ICONS, CloseIcon, LogoutIcon,
} from './Icons'

interface Props {
  open: boolean
  onClose: () => void
}

export default function NavBar({ open, onClose }: Props) {
  const { signOut } = useAuth()
  const location = useLocation()

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar / Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-gray-200 bg-white transition-transform duration-200 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand */}
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4">
          <Link to="/dashboard" className="text-lg font-bold tracking-tight">
            Proline V1
          </Link>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 lg:hidden">
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-2 py-4">
          <ul className="space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const Icon = NAV_ICONS[item.key]
              const isActive = location.pathname === item.path
              return (
                <li key={item.key}>
                  <Link
                    to={item.path}
                    onClick={onClose}
                    className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Logout */}
        <div className="border-t border-gray-200 p-2">
          <button
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <LogoutIcon className="h-5 w-5 shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  )
}
