export interface ResearchArea {
  id: number
  nome: string
  cursoId?: number
  cursoNome?: string
}

export interface ResearchAreaPayload {
  nome: string
  cursoId?: number
}
