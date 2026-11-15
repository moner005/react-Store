import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { routes } from '@/constants/routes'
import { useAuthStore } from '@/stores/authStore'

export function RequireAccount({ children, access = 'signed-in' }: {
  children: ReactNode
  access?: 'signed-in' | 'staff' | 'owner'
}) {
  const { user, status, restore } = useAuthStore()
  if (status === 'loading') return <p role="status">Checking your session…</p>
  if (status === 'error') {
    return <p role="alert">Could not check your session. <button type="button" onClick={() => void restore()}>Retry</button></p>
  }
  if (!user) return <Navigate to={routes.login} replace />
  if ((access === 'owner' && user.role !== 'owner') || (access === 'staff' && user.role === 'user')) {
    return <p role="alert">You do not have access to this page.</p>
  }
  return children
}
