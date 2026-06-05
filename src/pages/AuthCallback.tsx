import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function AuthCallback() {
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setError('Authentication failed — no session returned.')
      }
    })
  }, [])

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-sm rounded-xl bg-white p-8 text-center shadow-lg">
          <h1 className="mb-4 text-2xl font-bold text-red-600">Authentication Error</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  return <Navigate to="/dashboard" replace />
}
