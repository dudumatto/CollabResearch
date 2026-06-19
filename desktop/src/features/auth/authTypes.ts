export type UserRole = 'ALUNO' | 'ORIENTADOR' | 'ADMIN'

export interface AuthUser {
  id: number
  nome: string
  email: string
  tipo: UserRole
  ativo: boolean
}

export interface AuthResponse {
  token: string
  usuario: AuthUser
}
