const labelMap: Record<string, string> = {
  ADMIN: 'Administradores',
  ALUNO: 'Alunos',
  ORIENTADOR: 'Orientadores',
  ABERTO: 'Abertos',
  APROVADO: 'Aprovadas',
  CANCELADO: 'Canceladas',
  EM_ANALISE: 'Em analise',
  EM_ANDAMENTO: 'Em andamento',
  FINALIZADO: 'Finalizados',
  PENDENTE: 'Pendentes',
  REJEITADO: 'Rejeitadas',
  VERIFICADO: 'Verificados',
}

export function formatReportLabel(value: string) {
  const key = value.trim().toUpperCase()
  if (labelMap[key]) return labelMap[key]

  const lower = value.replace(/_/g, ' ').trim().toLowerCase()
  return lower.charAt(0).toUpperCase() + lower.slice(1)
}

export function sumReportValues(values: Record<string, number>) {
  return Object.values(values).reduce((total, value) => total + value, 0)
}
