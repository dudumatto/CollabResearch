export interface AuditLog {
  id: number
  administrador: string
  acao: string
  recurso: string
  recursoId?: number
  descricao?: string
  dataEvento: string
}
