export type DocumentStatus = 'ENVIADO' | 'EM_ANALISE' | 'VERIFICADO' | 'REJEITADO'

export interface DocumentItem {
  id: number
  usuarioId: number
  usuarioNome: string
  tipo: 'CURRICULO' | 'HISTORICO'
  status: DocumentStatus
  observacaoStatus?: string
  nomeArquivo: string
  url?: string
  dataEnvio: string
  downloadUrl: string
  previewUrl: string
}
