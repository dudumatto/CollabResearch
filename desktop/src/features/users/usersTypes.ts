import type { UserRole } from '../auth/authTypes'

export interface UserProfile {
  id: number
  nome: string
  email: string
  tipo: UserRole
  ativo: boolean
  dataCadastro: string
  instituicao?: string
  bio?: string
  ra?: string
  semestre?: number
  interesses?: string
  cursoNome?: string
  departamento?: string
  titulacao?: string
}

export interface UserPayload {
  nome: string
  email: string
  senha?: string
  tipo: UserRole
  ativo?: boolean
  instituicao?: string
  bio?: string
  ra?: string
  semestre?: number
  departamento?: string
  titulacao?: string
}
