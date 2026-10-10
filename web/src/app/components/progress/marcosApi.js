// Fachada única das funções de marcos/tarefas (contrato em arquitetura/progresso-marcos-contrato.md).
// As funções reais vivem em services/progressService.js (dono: agente funcional).
import * as progressModule from "../../services/progressService";
import * as marcosMock from "./marcosMock";

const USAR_MOCK = import.meta.env?.VITE_MARCOS_MOCK === "true";

const NOMES = [
  "getProgressSummary", "listMarcos", "createMarco", "updateMarco", "deleteMarco", "reorderMarcos",
  "createTarefa", "updateTarefa", "toggleTarefa", "deleteTarefa", "reorderTarefas",
  "submitMarcoForReview", "reviewMarco", "listRevisoes",
];

function resolver(nome) {
  const impl = USAR_MOCK
    ? marcosMock[nome]
    : progressModule[nome] ?? progressModule.progressService?.[nome];
  if (typeof impl !== "function") {
    throw new Error(`Função ${nome} ainda não está disponível no progressService.`);
  }
  return impl;
}

export const marcosApi = Object.fromEntries(
  NOMES.map((nome) => [nome, (...args) => Promise.resolve().then(() => resolver(nome)(...args))]),
);
