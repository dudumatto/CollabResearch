import { apiClient } from '../../lib/apiClient'
import type { ResearchArea, ResearchAreaPayload } from './areasTypes'

export const areasService = {
  list: () => apiClient.get<ResearchArea[]>('/admin/areas'),
  create: (payload: ResearchAreaPayload) => apiClient.post<ResearchArea>('/admin/areas', payload),
  update: (id: number, payload: ResearchAreaPayload) => apiClient.put<ResearchArea>(`/admin/areas/${id}`, payload),
  remove: (id: number) => apiClient.delete(`/admin/areas/${id}`),
}
