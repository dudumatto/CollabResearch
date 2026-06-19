import { apiClient } from '../../lib/apiClient'
import type { PageResponse } from '../../lib/apiTypes'
import type { DocumentItem, DocumentStatus } from './documentsTypes'

const isPublicDocumentUrl = (value?: string) => {
  if (!value) return false
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && url.hostname.endsWith('.supabase.co')
  } catch {
    return false
  }
}

const blobFromUrl = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) throw new Error('Nao foi possivel carregar o documento no Supabase.')
  return response.blob()
}

const fallbackPath = (url: string) => url.replace('/api', '')

export const documentsService = {
  list: (status?: DocumentStatus) => apiClient.get<PageResponse<DocumentItem>>(`/admin/documentos?size=50${status ? `&status=${status}` : ''}`),
  setStatus: (id: number, status: DocumentStatus, observacao?: string) =>
    apiClient.patch<DocumentItem>(`/admin/documentos/${id}/status`, { status, observacao }),
  remove: (id: number) => apiClient.delete(`/admin/documentos/${id}`),
  previewUrl: (document: DocumentItem) => isPublicDocumentUrl(document.url) ? document.url : undefined,
  preview: (document: DocumentItem) => isPublicDocumentUrl(document.url)
    ? blobFromUrl(document.url as string)
    : apiClient.blob(fallbackPath(document.previewUrl)),
  download: (document: DocumentItem) => isPublicDocumentUrl(document.url)
    ? blobFromUrl(document.url as string)
    : apiClient.blob(fallbackPath(document.downloadUrl)),
}
