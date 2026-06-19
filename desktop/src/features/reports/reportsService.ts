import { apiClient } from '../../lib/apiClient'
import type { ReportSummary } from './reportsTypes'

export const reportsService = {
  summary: () => apiClient.get<ReportSummary>('/admin/relatorios/resumo'),
}
