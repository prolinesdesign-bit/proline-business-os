import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import AuthCallback from './pages/AuthCallback'
import { useAuth } from './context/AuthContext'

function Dashboard() {
  const { signOut } = useAuth()
  return (
    <div>
      <div className="flex items-center justify-between p-4">
        <h1 className="text-3xl font-bold underline">Proline V1</h1>
        <button onClick={signOut} className="rounded-lg border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50">
          Logout
        </button>
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
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
