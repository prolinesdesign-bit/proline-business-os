import { Routes, Route, Navigate, Link } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import AuthCallback from './pages/AuthCallback'
import Projects from './pages/Projects'
import { useAuth } from './context/AuthContext'

function Dashboard() {
  const { signOut } = useAuth()
  return (
    <div>
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <h1 className="text-xl font-bold">Proline V1</h1>
        <nav className="flex items-center gap-4">
          <Link to="/projects" className="text-sm text-blue-600 hover:underline">Projects</Link>
          <button onClick={signOut} className="rounded-lg border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50">
            Logout
          </button>
        </nav>
      </div>
      <div className="p-4">
        <p className="text-gray-500">Welcome. Select a module from the navigation above.</p>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects"
        element={
          <ProtectedRoute>
            <Projects />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
