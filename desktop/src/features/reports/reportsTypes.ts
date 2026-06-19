export interface ReportSummary {
  geradoEm: string
  usuariosPorTipo: Record<string, number>
  projetosPorStatus: Record<string, number>
  inscricoesPorStatus: Record<string, number>
  documentosPorStatus: Record<string, number>
}
