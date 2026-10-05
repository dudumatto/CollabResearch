export interface DocumentItem {
  id: number
  usuarioId: number
  usuarioNome: string
  tipo: 'CURRICULO' | 'HISTORICO'
  nomeArquivo: string
  url?: string
  dataEnvio: string
  downloadUrl: string
  previewUrl: string
}
