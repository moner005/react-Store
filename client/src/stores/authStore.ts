import { create } from 'zustand'
import { clearSession, getSession, loginUser, saveSession } from '@/services/authStorage'
import type { SessionUser } from '@/types/auth'

interface AuthStore {
  user: SessionUser | null
  login: (email: string, password: string) => boolean
  logout: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: getSession(),
  login: (email, password) => {
    const user = loginUser(email, password)

    if (!user) {
      return false
    }

    saveSession(user)
    set({ user })
    return true
  },
  logout: () => {
    clearSession()
    set({ user: null })
  },
}))
