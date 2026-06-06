import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusIcon, CloseIcon } from './Icons'

const ACTIONS = [
  { label: 'New Project', path: '/projects', hint: 'Add a new project' },
  { label: 'New Client', path: '/clients', hint: 'Add a new client' },
  { label: 'New Payment', path: '/payments', hint: 'Record a payment' },
  { label: 'New Expense', path: '/expenses', hint: 'Record an expense' },
]

export default function QuickActions() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  function handleAction(path: string) {
    setOpen(false)
    navigate(path)
  }

  return (
    <div className="fixed bottom-6 right-6 z-30">
      {/* Action menu */}
      {open && (
        <div className="mb-3 flex flex-col items-end gap-2">
          {ACTIONS.map((a) => (
            <button
              key={a.path}
              onClick={() => handleAction(a.path)}
              title={a.hint}
              className="flex items-center gap-2 rounded-lg bg-card px-4 py-3 text-sm font-medium text-card-foreground shadow-lg ring-1 ring-border hover:bg-accent hover:text-primary transition-all animate-[fadeIn_0.15s_ease-out]"
            >
              {a.label}
            </button>
          ))}
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setOpen(!open)}
        className={`flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg transition-all hover:scale-105 active:scale-95 ${
          open ? 'bg-muted-foreground rotate-45' : 'bg-primary'
        }`}
        aria-label={open ? 'Close quick actions' : 'Open quick actions'}
      >
        {open ? <CloseIcon className="h-5 w-5" /> : <PlusIcon className="h-5 w-5" />}
      </button>
    </div>
  )
}
