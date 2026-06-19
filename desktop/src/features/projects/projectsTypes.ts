export type ProjectStatus = 'ABERTO' | 'EM_ANDAMENTO' | 'FINALIZADO'

export interface Project {
  id: number
  titulo: string
  descricao?: string
  requisitos?: string
  tecnologias?: string
  vagas: number
  status: ProjectStatus
  dataCriacao: string
  dataInicio?: string
  dataFim?: string
  dataLimiteInscricao?: string
  areaId: number
  areaNome: string
  orientadorNome?: string
  alunoCriadorNome?: string
}

export interface ProjectPayload {
  titulo: string
  descricao?: string
  requisitos?: string
  tecnologias?: string
  vagas: number
  areaId: number
  dataInicio?: string
  dataFim?: string
  dataLimiteInscricao?: string
}
