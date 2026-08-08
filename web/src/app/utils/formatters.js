export function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("pt-BR");
}

export function formatUserType(value) {
  return value === "ALUNO" ? "Aluno" : value === "ORIENTADOR" ? "Orientador" : value ?? "-";
}

export function formatProjectStatus(value) {
  const map = {
    PENDENTE_ORIENTADOR: "Aguardando orientador",
    ABERTO: "Aberto",
    EM_ANDAMENTO: "Em andamento",
    FINALIZADO: "Finalizado",
    REJEITADO_ORIENTADOR: "Recusado pelo orientador",
  };

  return map[value] ?? value ?? "-";
}

export function formatApplicationStatus(value) {
  const map = {
    PENDENTE: "Pendente",
    APROVADO: "Aprovado",
    REJEITADO: "Rejeitado",
  };

  return map[value] ?? value ?? "-";
}

export function formatNotificationType(value) {
  const map = {
    SOLICITACAO_ORIENTACAO: "Solicitação de orientação",
    PROJETO_ACEITO: "Projeto aceito",
    PROJETO_REJEITADO: "Projeto recusado",
    INSCRICAO_RECEBIDA: "Inscrição recebida",
    INSCRICAO_APROVADA: "Inscrição aprovada",
    INSCRICAO_REJEITADA: "Inscrição rejeitada",
    MENSAGEM_RECEBIDA: "Mensagem recebida",
    PROGRESSO_REGISTRADO: "Progresso registrado",
  };

  return map[value] ?? value ?? "-";
}

export function formatEtapaStatus(value) {
  const map = {
    PENDING: "Pendente",
    ACTIVE: "Em andamento",
    DONE: "Concluída",
    REJECTED: "Rejeitada",
  };

  return map[value] ?? value ?? "-";
}

export function formatEtapaResponsavel(value) {
  const map = {
    ALUNO: "Aluno",
    ORIENTADOR: "Orientador",
    AMBOS: "Aluno e orientador",
  };

  return map[value] ?? value ?? "-";
}

export function formatEntregaStatus(value) {
  const map = {
    PENDING_REVIEW: "Aguardando revisão",
    CHANGES_REQUESTED: "Ajustes solicitados",
    APPROVED: "Aprovada",
  };

  return map[value] ?? value ?? "-";
}

export function formatEntregaDecisao(value) {
  const map = {
    APPROVED: "Aprovar",
    CHANGES_REQUESTED: "Solicitar ajustes",
  };

  return map[value] ?? value ?? "-";
}

export function formatOrientandoSituacao(value) {
  const map = {
    EM_ANDAMENTO: "Em andamento",
    ABERTO: "Ativo",
    FINALIZADO: "Finalizado",
    INATIVO: "Inativo",
  };

  return map[value] ?? value ?? "-";
}

export function formatAvaliacaoNota(value) {
  if (value === null || value === undefined || value === "") return "-";
  const number = Number(value);
  return Number.isFinite(number) ? number.toLocaleString("pt-BR", { minimumFractionDigits: 2 }) : String(value);
}
