// MOCK local para desenvolver/verificar as telas sem backend.
// Ativado apenas com VITE_MARCOS_MOCK=true. Para remover: apagar este arquivo e o desvio em marcosApi.js.
import { resumoDeMarcos } from "./marcoUtils";

const dia = (offset) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString();
};

const t = (id, titulo, origem, concluida, obrigatoria = false, ordem = id) => ({
  id, titulo, origem, concluida, obrigatoria, ordem, concluidaEm: concluida ? dia(-2) : null,
});

const store = {
  marcos: [
    { id: 1, projetoId: 1, titulo: "Revisão bibliográfica", descricao: "Levantar e fichar as referências principais.", ordem: 1, prazo: dia(-3), status: "REJECTED", emRevisao: false,
      tarefas: [t(1, "Ler 10 artigos-base", "ORIENTADOR", true, true), t(2, "Fichar referências no gerenciador", "ORIENTADOR", true, true), t(3, "Escrever síntese de 2 páginas", "ORIENTADOR", false, true), t(4, "Pedir livro na biblioteca", "ALUNO", true)],
      ultimaRevisao: { acao: "DEVOLVIDO", comentario: "A síntese precisa citar ao menos três fontes nacionais.", autorNome: "Prof. Marina Alves", criadoEm: dia(-1) } },
    { id: 2, projetoId: 1, titulo: "Metodologia definida com um título bem comprido para testar quebra de linha em telas estreitas", descricao: "Fechar o desenho do estudo e os instrumentos.", ordem: 2, prazo: dia(10), status: "ACTIVE", emRevisao: true,
      tarefas: [t(5, "Definir população e amostra", "ORIENTADOR", true, true), t(6, "Validar questionário", "ORIENTADOR", true, true), t(7, "Submeter ao comitê de ética", "ORIENTADOR", true, false)],
      ultimaRevisao: { acao: "ENVIADO", comentario: "", autorNome: "Aluno", criadoEm: dia(0) } },
    { id: 3, projetoId: 1, titulo: "Coleta de dados", descricao: "", ordem: 3, prazo: dia(30), status: "ACTIVE", emRevisao: false,
      tarefas: [t(8, "Agendar entrevistas", "ORIENTADOR", true, true), t(9, "Realizar entrevistas", "ORIENTADOR", false, true), t(10, "Transcrever áudios", "ORIENTADOR", false, false), t(11, "Organizar planilha de códigos", "ALUNO", false)],
      ultimaRevisao: null },
    { id: 4, projetoId: 1, titulo: "Proposta aprovada", descricao: "Entrega inicial.", ordem: 0, prazo: dia(-40), status: "DONE", emRevisao: false,
      tarefas: [t(12, "Entregar proposta", "ORIENTADOR", true, true)],
      ultimaRevisao: { acao: "APROVADO", comentario: "Ótimo trabalho.", autorNome: "Prof. Marina Alves", criadoEm: dia(-38) } },
    { id: 5, projetoId: 1, titulo: "Redação final", descricao: "Ainda sem tarefas definidas.", ordem: 5, prazo: null, status: "PENDING", emRevisao: false, tarefas: [], ultimaRevisao: null },
  ],
  revisoes: { 1: [
    { id: 1, acao: "ENVIADO", comentario: "", autorNome: "Aluno", criadoEm: dia(-5) },
    { id: 2, acao: "DEVOLVIDO", comentario: "A síntese precisa citar ao menos três fontes nacionais.", autorNome: "Prof. Marina Alves", criadoEm: dia(-1) },
  ] },
  seq: 100,
};

const espera = (valor) => new Promise((resolve) => setTimeout(() => resolve(structuredClone(valor)), 120));
const achar = (id) => store.marcos.find((m) => String(m.id) === String(id));

function recalcular(marco) {
  const total = marco.tarefas.length;
  const feitas = marco.tarefas.filter((x) => x.concluida).length;
  marco.itensTotal = total;
  marco.itensConcluidos = feitas;
  marco.percentual = total ? Math.round((feitas / total) * 100) : 0;
  marco.semTarefas = total === 0;
  if (marco.status !== "DONE" && marco.status !== "REJECTED") marco.status = feitas > 0 ? "ACTIVE" : "PENDING";
  return marco;
}
store.marcos.forEach(recalcular);

const registrar = (marco, acao, comentario) => {
  const item = { id: ++store.seq, acao, comentario: comentario ?? "", autorNome: acao === "ENVIADO" ? "Aluno" : "Prof. Marina Alves", criadoEm: new Date().toISOString() };
  (store.revisoes[marco.id] ??= []).push(item);
  marco.ultimaRevisao = item;
};

export const getProgressSummary = async () => espera({ ...resumoDeMarcos(store.marcos), atualizacoesTotal: 3 });
export const listMarcos = async () => espera([...store.marcos].sort((a, b) => a.ordem - b.ordem));
export const createMarco = async (_p, dados) => {
  const marco = recalcular({ id: ++store.seq, projetoId: 1, descricao: "", ordem: store.marcos.length + 1, status: "PENDING", emRevisao: false, tarefas: [], ultimaRevisao: null, ...dados });
  store.marcos.push(marco);
  return espera(marco);
};
export const updateMarco = async (_p, id, dados) => espera(Object.assign(achar(id), dados));
export const deleteMarco = async (_p, id) => { store.marcos = store.marcos.filter((m) => String(m.id) !== String(id)); return espera(null); };
export const reorderMarcos = async (_p, ids) => { ids.forEach((id, i) => { achar(id).ordem = i + 1; }); return espera(null); };
export const createTarefa = async (_p, marcoId, { titulo, obrigatoria }) => {
  const origem = globalThis.__marcosMockPapel === "ORIENTADOR" ? "ORIENTADOR" : "ALUNO";
  const marco = achar(marcoId);
  marco.tarefas.push({ id: ++store.seq, titulo, obrigatoria: Boolean(obrigatoria), origem, concluida: false, concluidaEm: null, ordem: marco.tarefas.length + 1 });
  recalcular(marco);
  return espera(marco);
};
export const updateTarefa = async (_p, marcoId, tarefaId, patch) => {
  const marco = achar(marcoId);
  Object.assign(marco.tarefas.find((x) => String(x.id) === String(tarefaId)), patch);
  recalcular(marco);
  return espera(marco);
};
export const toggleTarefa = async (p, marcoId, tarefaId, concluida) => updateTarefa(p, marcoId, tarefaId, { concluida, concluidaEm: concluida ? new Date().toISOString() : null });
export const deleteTarefa = async (_p, marcoId, tarefaId) => {
  const marco = achar(marcoId);
  marco.tarefas = marco.tarefas.filter((x) => String(x.id) !== String(tarefaId));
  recalcular(marco);
  return espera(marco);
};
export const reorderTarefas = async (_p, marcoId, ids) => { ids.forEach((id, i) => { achar(marcoId).tarefas.find((x) => String(x.id) === String(id)).ordem = i + 1; }); return espera(null); };
export const submitMarcoForReview = async (_p, marcoId) => {
  const marco = achar(marcoId);
  marco.emRevisao = true;
  if (marco.status === "REJECTED") marco.status = "ACTIVE";
  registrar(marco, "ENVIADO");
  return espera(marco);
};
export const reviewMarco = async (_p, marcoId, { acao, comentario }) => {
  const marco = achar(marcoId);
  marco.emRevisao = false;
  marco.status = acao === "APROVAR" ? "DONE" : "REJECTED";
  registrar(marco, acao === "APROVAR" ? "APROVADO" : "DEVOLVIDO", comentario);
  return espera(marco);
};
export const listRevisoes = async (_p, marcoId) => espera([...(store.revisoes[marcoId] ?? [])].reverse());
