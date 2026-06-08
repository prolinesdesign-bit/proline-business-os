import { useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function SignUp() {
  const { user, signUp } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  if (user) return <Navigate to="/dashboard" replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const err = await signUp(email, password)
      if (err) {
        setError(err)
      } else {
        setSuccess(true)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sign up failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-background via-background to-success-light/30 px-4 dark:to-success-light/10">
        <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-success/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="w-full max-w-sm animate-fade-in">
          <div className="rounded-xl border border-border/50 bg-card/80 p-8 text-center shadow-xl shadow-black/5 backdrop-blur-xl">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success-light text-success dark:bg-success/20">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="mb-2 font-display text-3xl tracking-tight">Check your email</h1>
            <p className="text-muted-foreground">We sent a confirmation link to <strong>{email}</strong></p>
            <Link to="/login" className="mt-6 inline-block text-sm font-medium text-primary transition-colors hover:text-primary-hover">Back to Sign In</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-background via-background to-primary-light/30 px-4 dark:to-primary-light/10">
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-brand/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />

      <div className="w-full max-w-sm animate-fade-in">
        <div className="rounded-xl border border-border/50 bg-card/80 p-8 shadow-xl shadow-black/5 backdrop-blur-xl">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center">
              <img src="/logo.png" alt="Proline" className="h-14 w-14 rounded-xl object-cover shadow-sm dark:brightness-0 dark:invert" />
            </div>
            <h1 className="font-display text-3xl tracking-tight">Create Account</h1>
            <p className="mt-1 text-sm text-muted-foreground">Get started with Proline</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="animate-fade-in-delay-1">
              <label htmlFor="email" className="block text-sm font-medium text-foreground">Email</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm transition-colors focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            <div className="animate-fade-in-delay-2">
              <label htmlFor="password" className="block text-sm font-medium text-foreground">Password</label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm transition-colors focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            {error && <p className="animate-fade-in text-sm text-destructive">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="animate-fade-in-delay-3 w-full rounded-lg bg-gradient-to-r from-primary to-primary/90 px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:from-primary-hover hover:to-primary hover:shadow-md active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
            >
              {submitting ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary transition-colors hover:text-primary-hover">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
