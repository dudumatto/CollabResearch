export interface RecentAudit {
  id: number
  administrador: string
  acao: string
  recurso: string
  recursoId: number
  descricao: string
  dataEvento: string
}

export interface DashboardSummary {
  totalUsuarios: number
  usuariosAtivos: number
  totalAlunos: number
  totalOrientadores: number
  totalAdministradores: number
  totalProjetos: number
  projetosAbertos: number
  inscricoesPendentes: number
  documentosEmAnalise: number
  atividadesRecentes: RecentAudit[]
}
