import { apiClient } from '../../lib/apiClient'
import type { DashboardSummary } from './dashboardTypes'

export const dashboardService = {
  load: () => apiClient.get<DashboardSummary>('/admin/dashboard'),
}
