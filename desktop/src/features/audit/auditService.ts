import { apiClient } from '../../lib/apiClient'
import type { PageResponse } from '../../lib/apiTypes'
import type { AuditLog } from './auditTypes'

export const auditService = {
  list: () => apiClient.get<PageResponse<AuditLog>>('/admin/auditoria?size=60'),
}
