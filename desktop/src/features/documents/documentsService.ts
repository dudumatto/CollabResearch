import { apiClient } from '../../lib/apiClient'
import type { PageResponse } from '../../lib/apiTypes'
import type { DocumentItem, DocumentStatus } from './documentsTypes'

const fallbackPath = (url: string) => url.replace('/api', '')

export const documentsService = {
  list: (status?: DocumentStatus) => apiClient.get<PageResponse<DocumentItem>>(`/admin/documentos?size=50${status ? `&status=${status}` : ''}`),
  setStatus: (id: number, status: DocumentStatus, observacao?: string) =>
    apiClient.patch<DocumentItem>(`/admin/documentos/${id}/status`, { status, observacao }),
  remove: (id: number) => apiClient.delete(`/admin/documentos/${id}`),
  previewUrl: (_document: DocumentItem) => undefined,
  preview: (document: DocumentItem) => apiClient.blob(fallbackPath(document.downloadUrl)),
  download: (document: DocumentItem) => apiClient.blob(fallbackPath(document.downloadUrl)),
}
