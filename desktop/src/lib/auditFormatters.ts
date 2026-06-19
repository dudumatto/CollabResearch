const actionLabels: Record<string, string> = {
  ALTERAR_STATUS: 'Alteracao de status',
  ATUALIZAR: 'Atualizacao',
  CRIAR: 'Criacao',
  REMOVER: 'Remocao',
  VALIDAR: 'Validacao',
  REJEITAR: 'Rejeicao',
}

const resourceLabels: Record<string, string> = {
  ADMINISTRADOR: 'administrador',
  ALUNO: 'aluno',
  AREA: 'area',
  DOCUMENTO: 'documento',
  INSCRICAO: 'inscricao',
  ORIENTADOR: 'orientador',
  PROJETO: 'projeto',
  RELATORIO: 'relatorio',
  USUARIO: 'usuario',
}

const resourceArticles: Record<string, string> = {
  ADMINISTRADOR: 'do',
  ALUNO: 'do',
  AREA: 'da',
  DOCUMENTO: 'do',
  INSCRICAO: 'da',
  ORIENTADOR: 'do',
  PROJETO: 'do',
  RELATORIO: 'do',
  USUARIO: 'do',
}

const statusLabels: Record<string, string> = {
  ABERTO: 'Aberto',
  APROVADO: 'Aprovado',
  CANCELADO: 'Cancelado',
  EM_ANALISE: 'Em analise',
  EM_ANDAMENTO: 'Em andamento',
  FINALIZADO: 'Finalizado',
  PENDENTE: 'Pendente',
  REJEITADO: 'Rejeitado',
  VERIFICADO: 'Verificado',
}

function normalize(value: string) {
  return value.trim().toUpperCase()
}

function humanize(value: string) {
  const lower = value.replace(/_/g, ' ').trim().toLowerCase()
  return lower.charAt(0).toUpperCase() + lower.slice(1)
}

export function formatAuditAction(action: string) {
  const key = normalize(action)
  return actionLabels[key] ?? humanize(action)
}

export function formatAuditResource(resource: string) {
  const key = normalize(resource)
  return resourceLabels[key] ?? humanize(resource).toLowerCase()
}

export function formatAuditTitle(action: string, resource: string) {
  const article = resourceArticles[normalize(resource)] ?? 'do'
  return `${formatAuditAction(action)} ${article} ${formatAuditResource(resource)}`
}

export function formatAuditDescription(description: string) {
  const trimmed = description.trim()
  if (!trimmed) return 'Sem descricao'

  return trimmed
    .split(/\s+/)
    .map((part) => statusLabels[normalize(part)] ?? part)
    .join(' ')
}
