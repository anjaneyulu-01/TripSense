import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { FullPageSpinner } from '@/components/ui/Spinner'

/** Guards nested routes: redirects unauthenticated users to /login. */
export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return <FullPageSpinner />
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return <Outlet />
}

/** Inverse guard: keeps signed-in users out of /login and /register. */
export function PublicOnlyRoute() {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) return <FullPageSpinner />
  if (isAuthenticated) return <Navigate to="/app" replace />
  return <Outlet />
}
