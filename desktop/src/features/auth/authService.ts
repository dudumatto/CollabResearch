import { apiClient } from '../../lib/apiClient'
import type { AuthResponse } from './authTypes'

export const authService = {
  login: (email: string, senha: string) =>
    apiClient.post<AuthResponse>('/auth/login', { email, senha }, true),
  logout: () => apiClient.post<string>('/auth/logout'),
}
