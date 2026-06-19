import { apiClient } from '../../lib/apiClient'
import type { PageResponse } from '../../lib/apiTypes'
import type { Project, ProjectPayload, ProjectStatus } from './projectsTypes'

export const projectsService = {
  list: (status?: ProjectStatus) => apiClient.get<PageResponse<Project>>(`/admin/projetos?size=50${status ? `&status=${status}` : ''}`),
  create: (payload: ProjectPayload) => apiClient.post<Project>('/admin/projetos', payload),
  update: (id: number, payload: ProjectPayload) => apiClient.put<Project>(`/admin/projetos/${id}`, payload),
  setStatus: (id: number, status: ProjectStatus) => apiClient.patch<Project>(`/admin/projetos/${id}/status`, { status }),
  remove: (id: number) => apiClient.delete(`/admin/projetos/${id}`),
}
