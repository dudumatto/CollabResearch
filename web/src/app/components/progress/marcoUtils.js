// Regras de apresentação dos marcos. Percentuais e contagens vêm prontos do backend;
// aqui só se decide como rotular, filtrar e ordenar o que já foi calculado.

export function prazoVencido(marco) {
  if (!marco?.prazo || marco.status === "DONE") return false;
  const prazo = new Date(marco.prazo);
  if (Number.isNaN(prazo.getTime())) return false;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  return prazo < hoje;
}

export function precisaAtencao(marco) {
  return marco?.status === "REJECTED" || prazoVencido(marco);
}

export function estadoMarco(marco) {
  if (marco?.status === "DONE") return { chave: "aprovado", rotulo: "Aprovado", tom: "ok" };
  if (marco?.emRevisao) return { chave: "revisao", rotulo: "Em revisão", tom: "info" };
  if (marco?.status === "REJECTED") return { chave: "devolvido", rotulo: "Devolvido", tom: "danger" };
  if (marco?.status === "ACTIVE") return { chave: "andamento", rotulo: "Em andamento", tom: "warn" };
  return { chave: "pendente", rotulo: "Não iniciado", tom: "muted" };
}

export const FILTROS_MARCO = [
  { id: "todos", rotulo: "Todos", testa: () => true },
  { id: "pendentes", rotulo: "Pendentes", testa: (m) => m.status !== "DONE" && !m.emRevisao },
  { id: "atencao", rotulo: "Atenção", testa: (m) => precisaAtencao(m) },
  { id: "revisao", rotulo: "Em revisão", testa: (m) => Boolean(m.emRevisao) },
  { id: "concluidos", rotulo: "Aprovados", testa: (m) => m.status === "DONE" },
];

export function contarFiltros(marcos) {
  return Object.fromEntries(FILTROS_MARCO.map((f) => [f.id, marcos.filter(f.testa).length]));
}

export function filtrarMarcos(marcos, filtroId) {
  const filtro = FILTROS_MARCO.find((f) => f.id === filtroId) ?? FILTROS_MARCO[0];
  return marcos.filter(filtro.testa);
}

export function textoItens(marco) {
  if (!marco || marco.semTarefas || !marco.itensTotal) return "Sem tarefas";
  return `${marco.itensConcluidos} de ${marco.itensTotal} ${marco.itensTotal === 1 ? "item concluído" : "itens concluídos"}`;
}

export function ordenarTarefas(tarefas = []) {
  return [...tarefas].sort((a, b) => Number(a.ordem ?? 0) - Number(b.ordem ?? 0));
}

export function tarefasDoOrientador(marco) {
  return ordenarTarefas((marco?.tarefas ?? []).filter((t) => t.origem !== "ALUNO"));
}

export function tarefasPessoais(marco) {
  return ordenarTarefas((marco?.tarefas ?? []).filter((t) => t.origem === "ALUNO"));
}

export function obrigatoriasPendentes(marco) {
  return (marco?.tarefas ?? []).filter((t) => t.obrigatoria && !t.concluida).length;
}

export function ordenarMarcos(marcos = []) {
  return [...marcos].sort((a, b) => Number(a.ordem ?? 0) - Number(b.ordem ?? 0));
}

export function resumoDeMarcos(marcos = []) {
  const itensTotal = marcos.reduce((s, m) => s + Number(m.itensTotal ?? 0), 0);
  const itensConcluidos = marcos.reduce((s, m) => s + Number(m.itensConcluidos ?? 0), 0);
  return {
    percentualGeral: itensTotal ? Math.round((itensConcluidos / itensTotal) * 100) : 0,
    itensConcluidos,
    itensTotal,
    marcosTotal: marcos.length,
    marcosConcluidos: marcos.filter((m) => m.status === "DONE").length,
    marcosEmRevisao: marcos.filter((m) => m.emRevisao).length,
    marcosComAtencao: marcos.filter(precisaAtencao).length,
    atualizacoesTotal: 0,
  };
}

export const ROTULO_ACAO_REVISAO = {
  ENVIADO: "Enviado para revisão",
  APROVADO: "Aprovado",
  DEVOLVIDO: "Devolvido para ajustes",
};

export const TOM_ACAO_REVISAO = { ENVIADO: "info", APROVADO: "ok", DEVOLVIDO: "danger" };

export function mensagemDeErro(err, padrao) {
  return err?.message || padrao;
}
