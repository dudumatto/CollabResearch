import { apiClient } from '../../lib/apiClient'
import type { PageResponse } from '../../lib/apiTypes'
import type { DocumentItem } from './documentsTypes'

const apiPath = (url: string | undefined, fallback: string) => {
  if (!url) return fallback
  return url.startsWith('/api/') ? url.slice(4) : url
}

export const documentsService = {
  list: () => apiClient.get<PageResponse<DocumentItem>>('/admin/documentos?size=50'),
  remove: (id: number) => apiClient.delete(`/admin/documentos/${id}`),
  previewUrl: (_document: DocumentItem) => undefined,
  preview: (document: DocumentItem) => apiClient.blob(apiPath(document.previewUrl, `/documentos/${document.id}/preview`)),
  download: (document: DocumentItem) => apiClient.blob(apiPath(document.downloadUrl, `/documentos/${document.id}/download`)),
}
