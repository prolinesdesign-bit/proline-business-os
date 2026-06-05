import { useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Toaster } from 'sonner'
import NavBar from './NavBar'
import Breadcrumbs from './Breadcrumbs'
import QuickActions from './QuickActions'
import { MenuIcon } from './Icons'

interface Props {
  children: ReactNode
}

export default function AppLayout({ children }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" richColors closeButton />
      <NavBar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-gray-200 bg-white px-4 lg:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 lg:hidden"
            aria-label="Open navigation menu"
          >
            <MenuIcon className="h-5 w-5" />
          </button>
          <Breadcrumbs />
        </header>

        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
        >
          {children}
        </motion.main>
      </div>

      <QuickActions />
    </div>
  )
}
