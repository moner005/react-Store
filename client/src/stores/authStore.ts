import { create } from 'zustand'
import { currentUser, loginUser, logoutUser } from '@/services/api/accounts'
import type { SessionUser } from '@/types/auth'

interface AuthStore {
  user: SessionUser | null
  status: 'loading' | 'ready' | 'error'
  restore: () => Promise<void>
  login: (email: string, password: string) => Promise<SessionUser>
  logout: () => Promise<void>
}

let restoreRequest: Promise<void> | undefined
let sessionRevision = 0

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  status: 'loading',
  restore: () => {
    if (restoreRequest) return restoreRequest
    const revision = sessionRevision
    set({ status: 'loading' })
    restoreRequest = currentUser()
      .then((user) => { if (revision === sessionRevision) set({ user, status: 'ready' }) })
      .catch(() => { if (revision === sessionRevision) set({ user: null, status: 'error' }) })
      .finally(() => { restoreRequest = undefined })
    return restoreRequest
  },
  login: async (email, password) => {
    const user = await loginUser(email, password)
    sessionRevision++
    set({ user, status: 'ready' })
    return user
  },
  logout: async () => {
    await logoutUser()
    sessionRevision++
    set({ user: null, status: 'ready' })
  },
}))
