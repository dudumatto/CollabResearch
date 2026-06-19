import { apiClient } from '../../lib/apiClient'
import type { PageResponse } from '../../lib/apiTypes'
import type { Application, ApplicationStatus } from './applicationsTypes'

export const applicationsService = {
  list: (status?: ApplicationStatus) => apiClient.get<PageResponse<Application>>(`/admin/inscricoes?size=50${status ? `&status=${status}` : ''}`),
  setStatus: (id: number, status: ApplicationStatus, parecer?: string) =>
    apiClient.patch<Application>(`/admin/inscricoes/${id}/status`, { status, parecer }),
  remove: (id: number) => apiClient.delete(`/admin/inscricoes/${id}`),
}
