import { useSyncExternalStore } from 'react'
import { tokenStorage } from '../../lib/tokenStorage'
import type { AuthUser } from './authTypes'

interface AuthState {
  token: string | null
  user: AuthUser | null
}

let state: AuthState = {
  token: tokenStorage.getToken(),
  user: tokenStorage.getUser<AuthUser>(),
}
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((listener) => listener())

export const authStore = {
  getState: () => state,
  setSession: (token: string, user: AuthUser) => {
    tokenStorage.save(token, user)
    state = { token, user }
    emit()
  },
  clear: () => {
    tokenStorage.clear()
    state = { token: null, user: null }
    emit()
  },
  subscribe: (listener: () => void) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
}

window.addEventListener('auth:expired', () => authStore.clear())

export const useAuthStore = () => useSyncExternalStore(authStore.subscribe, authStore.getState)
