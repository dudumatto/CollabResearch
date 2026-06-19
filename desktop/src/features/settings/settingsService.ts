import { apiClient } from '../../lib/apiClient'
import type { SystemSetting } from './settingsTypes'

export const settingsService = {
  list: () => apiClient.get<SystemSetting[]>('/admin/configuracoes'),
  update: (key: string, valor: string, descricao: string) =>
    apiClient.put<SystemSetting>(`/admin/configuracoes/${key}`, { valor, descricao }),
}
