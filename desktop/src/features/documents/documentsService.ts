import { apiClient } from '../../lib/apiClient'
import type { PageResponse } from '../../lib/apiTypes'
import type { DocumentItem, DocumentStatus } from './documentsTypes'

const apiPathFromUrl = (value?: string) => {
  if (!value) return undefined
  try {
    const url = new URL(value)
    const path = `${url.pathname}${url.search}`
    return path.startsWith('/api/') ? path.replace(/^\/api/, '') : path
  } catch {
    return value.startsWith('/api/') ? value.replace(/^\/api/, '') : value
  }
}

const documentBlob = (value?: string) => {
  const path = apiPathFromUrl(value)
  if (!path) throw new Error('Documento sem URL de acesso.')
  return apiClient.blob(path)
}

export const documentsService = {
  list: (status?: DocumentStatus) => apiClient.get<PageResponse<DocumentItem>>(`/admin/documentos?size=100${status ? `&status=${status}` : ''}`),
  setStatus: (id: number, status: DocumentStatus, observacao?: string) =>
    apiClient.patch<DocumentItem>(`/admin/documentos/${id}/status`, { status, observacao }),
  remove: (id: number) => apiClient.delete(`/admin/documentos/${id}`),
  preview: (document: DocumentItem) => documentBlob(document.previewUrl || document.downloadUrl || document.url),
  download: (document: DocumentItem) => documentBlob(document.downloadUrl || document.previewUrl || document.url),
}
