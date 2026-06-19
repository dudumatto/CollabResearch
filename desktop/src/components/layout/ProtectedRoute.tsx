import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../../features/auth/authStore'

export function ProtectedRoute() {
  const { token, user } = useAuthStore()
  if (!token || !user) return <Navigate to="/login" replace />
  if (user.tipo !== 'ADMIN') return <Navigate to="/login" replace />
  return <Outlet />
}
