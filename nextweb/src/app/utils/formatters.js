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
