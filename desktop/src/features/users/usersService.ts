import { apiClient } from '../../lib/apiClient'
import type { PageResponse } from '../../lib/apiTypes'
import type { UserRole } from '../auth/authTypes'
import type { UserPayload, UserProfile } from './usersTypes'

export const usersService = {
  list: (tipo?: UserRole | '', busca = '') => {
    const params = new URLSearchParams({ size: '40' })
    if (tipo) params.set('tipo', tipo)
    if (busca.trim()) params.set('busca', busca.trim())
    return apiClient.get<PageResponse<UserProfile>>(`/admin/usuarios?${params}`)
  },
  find: (id: number) => apiClient.get<UserProfile>(`/admin/usuarios/${id}`),
  create: (payload: UserPayload) => apiClient.post<UserProfile>('/admin/usuarios', payload),
  update: (id: number, payload: UserPayload) => apiClient.put<UserProfile>(`/admin/usuarios/${id}`, payload),
  setActive: (id: number, ativo: boolean) => apiClient.patch<UserProfile>(`/admin/usuarios/${id}/ativo`, { ativo }),
}
