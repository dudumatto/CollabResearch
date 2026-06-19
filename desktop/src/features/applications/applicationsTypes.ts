export type ApplicationStatus = 'PENDENTE' | 'APROVADO' | 'REJEITADO'

export interface Application {
  id: number
  status: ApplicationStatus
  dataInscricao: string
  motivacao?: string
  parecerOrientador?: string
  projetoId: number
  projetoTitulo: string
  alunoUsuarioId: number
  alunoNome: string
}
