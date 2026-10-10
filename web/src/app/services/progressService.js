import { api } from "./api";
import { mapMarco, mapRevisao } from "../utils/adapters";
import { etapaService } from "./etapaService";
import { projectService } from "./projectService";

const DEFAULT_STEPS = [
  { id: "legacy-1", title: "Proposta aprovada", description: "", weight: 10, stepOrder: 1 },
  { id: "legacy-2", title: "Revisão bibliográfica", description: "", weight: 15, stepOrder: 2 },
  { id: "legacy-3", title: "Metodologia definida", description: "", weight: 15, stepOrder: 3 },
  { id: "legacy-4", title: "Desenvolvimento", description: "", weight: 30, stepOrder: 4 },
  { id: "legacy-5", title: "Revisão do orientador", description: "", weight: 20, stepOrder: 5 },
  { id: "legacy-6", title: "Entrega final", description: "", weight: 10, stepOrder: 6 },
];

function normalizeStep(step) {
  if (!step) return null;

  return {
    id: step.id,
    title: step.title ?? step.titulo ?? "Etapa",
    description: step.description ?? step.descricao ?? "",
    weight: Number(step.weight ?? step.peso ?? 0),
    stepOrder: Number(step.stepOrder ?? step.ordem ?? 0),
    status: String(step.status ?? "PENDING").toUpperCase(),
    responsible: String(step.responsible ?? step.responsavel ?? "AMBOS").toUpperCase(),
    deadline: step.deadline ?? step.prazo ?? step.dataPrazo ?? null,
    prazo: step.prazo ?? step.deadline ?? step.dataPrazo ?? null,
    completedAt: step.completedAt ?? step.concluidaEm ?? null,
    completedBy: step.completedBy ?? step.concluidaPor ?? null,
    emRevisao: Boolean(step.emRevisao),
    itensConcluidos: Number(step.itensConcluidos ?? 0),
    itensTotal: Number(step.itensTotal ?? 0),
    percentual: Number(step.percentual ?? 0),
  };
}

function normalizeLegacyStage(stage) {
  const normalized = normalizeStep(stage);
  if (!normalized) return null;

  return {
    ...normalized,
    title: stage?.titulo ?? normalized.title,
    description: stage?.descricao ?? normalized.description,
    weight: Number(stage?.peso ?? normalized.weight ?? 0),
    stepOrder: Number(stage?.ordem ?? normalized.stepOrder ?? 0),
    responsible: String(stage?.responsavel ?? normalized.responsible ?? "AMBOS").toUpperCase(),
    deadline: stage?.prazo ?? normalized.deadline ?? null,
    prazo: stage?.prazo ?? normalized.prazo ?? null,
    completedAt: stage?.concluidaEm ?? normalized.completedAt ?? null,
    completedBy: stage?.concluidaPor ?? normalized.completedBy ?? null,
  };
}

function parseMetadataJson(value) {
  if (!value || typeof value !== "string") return {};

  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function normalizeUpdate(update) {
  if (!update) return null;

  const createdBy = update.createdBy ?? update.autor ?? update.usuario ?? null;
  const metadata = parseMetadataJson(update.metadataJson);
  const stepId = update.stepId ?? update.etapaId ?? metadata.stepId ?? metadata.etapaId ?? null;
  const stepTitle = update.stepTitle ?? update.etapaTitle ?? update.etapaTitulo ?? metadata.stepTitle ?? metadata.etapaTitulo ?? null;

  return {
    id: update.id,
    title: update.title ?? update.titulo ?? "Atualização",
    description: update.description ?? update.descricao ?? "",
    category: String(update.category ?? update.categoria ?? "progress").toLowerCase(),
    stepId,
    stepTitle,
    createdBy,
    createdAt: update.createdAt ?? update.dataRegistro ?? metadata.dataRegistro ?? null,
  };
}

function normalizeSummary(payload) {
  return {
    projectId: payload?.projectId ?? payload?.projetoId ?? null,
    overallPercent: Number(payload?.overallPercent ?? payload?.percentualGeral ?? 0),
    percentualGeral: Number(payload?.percentualGeral ?? payload?.overallPercent ?? 0),
    itensConcluidos: Number(payload?.itensConcluidos ?? 0),
    itensTotal: Number(payload?.itensTotal ?? 0),
    marcosTotal: Number(payload?.marcosTotal ?? 0),
    marcosConcluidos: Number(payload?.marcosConcluidos ?? 0),
    marcosEmRevisao: Number(payload?.marcosEmRevisao ?? 0),
    marcosComAtencao: Number(payload?.marcosComAtencao ?? 0),
    atualizacoesTotal: Number(payload?.atualizacoesTotal ?? 0),
    steps: Array.isArray(payload?.steps) ? payload.steps.map(normalizeStep).filter(Boolean) : [],
    marcos: Array.isArray(payload?.marcos) ? payload.marcos.map(mapMarco).filter(Boolean) : [],
    updates: Array.isArray(payload?.updates) ? payload.updates.map(normalizeUpdate).filter(Boolean) : [],
  };
}

function mapLegacyUpdates(items) {
  return Array.isArray(items) ? items.map(normalizeUpdate).filter(Boolean) : [];
}

function buildLegacySteps(project, updates) {
  const completedCount =
    project?.status === "FINALIZADO"
      ? DEFAULT_STEPS.length
      : project?.status === "EM_ANDAMENTO"
        ? Math.min(DEFAULT_STEPS.length - 1, Math.max(1, Math.ceil((updates?.length ?? 0) / 2)))
        : (updates?.length ?? 0) > 0
          ? 1
          : 0;

  return DEFAULT_STEPS.map((step, index) => ({
    ...step,
    status:
      index < completedCount
        ? "DONE"
        : index === completedCount
          ? "ACTIVE"
          : "PENDING",
    completedAt: null,
    completedBy: null,
  }));
}

function calcOverallFromSteps(steps) {
  return steps
    .filter((step) => step.status === "DONE")
    .reduce((sum, step) => sum + Number(step.weight ?? 0), 0);
}

// ---- Marcos com checklist (contrato: arquitetura/progresso-marcos-contrato.md) ----
// Todos os cálculos (itens, percentual, status, emRevisao) vêm prontos do backend.
// Mutações de marco/tarefa/revisão devolvem o marco atualizado, já normalizado.
// A origem da tarefa (ORIENTADOR|ALUNO) é derivada do papel no backend; o front não envia.

const etapasPath = (projectId) => `/api/projetos/${projectId}/etapas`;
const marcoPath = (projectId, marcoId) => `${etapasPath(projectId)}/${marcoId}`;
const tarefaPath = (projectId, marcoId, tarefaId) => `${marcoPath(projectId, marcoId)}/tarefas/${tarefaId}`;

function pick(source, keys) {
  const out = {};
  for (const key of keys) {
    if (source?.[key] !== undefined) out[key] = source[key];
  }
  return out;
}

const MARCO_FIELDS = ["titulo", "descricao", "responsavel", "prazo", "obrigatoria"];
const mapMarcos = (payload) => (Array.isArray(payload) ? payload.map(mapMarco).filter(Boolean) : []);

export async function getProgressSummary(projectId) {
  return normalizeSummary(await api.get(`/api/projects/${projectId}/progress`));
}

export async function listMarcos(projectId, options = {}) {
  return mapMarcos(await api.get(etapasPath(projectId), options));
}

export async function createMarco(projectId, payload) {
  return mapMarco(await api.post(etapasPath(projectId), pick(payload, MARCO_FIELDS)));
}

export async function updateMarco(projectId, marcoId, payload) {
  return mapMarco(await api.put(marcoPath(projectId, marcoId), pick(payload, MARCO_FIELDS)));
}

export async function deleteMarco(projectId, marcoId) {
  await api.delete(marcoPath(projectId, marcoId));
  return null;
}

export async function reorderMarcos(projectId, ids) {
  return mapMarcos(await api.put(`${etapasPath(projectId)}/ordem`, { ids }));
}

export async function createTarefa(projectId, marcoId, { titulo, obrigatoria } = {}) {
  return mapMarco(
    await api.post(`${marcoPath(projectId, marcoId)}/tarefas`, { titulo, obrigatoria: Boolean(obrigatoria) }),
  );
}

export async function updateTarefa(projectId, marcoId, tarefaId, patch) {
  return mapMarco(await api.patch(tarefaPath(projectId, marcoId, tarefaId), pick(patch, ["titulo", "obrigatoria", "concluida"])));
}

export function toggleTarefa(projectId, marcoId, tarefaId, concluida) {
  return updateTarefa(projectId, marcoId, tarefaId, { concluida: Boolean(concluida) });
}

export async function deleteTarefa(projectId, marcoId, tarefaId) {
  return mapMarco(await api.delete(tarefaPath(projectId, marcoId, tarefaId)));
}

export async function reorderTarefas(projectId, marcoId, ids) {
  return mapMarco(await api.put(`${marcoPath(projectId, marcoId)}/tarefas/ordem`, { ids }));
}

export async function submitMarcoForReview(projectId, marcoId) {
  return mapMarco(await api.post(`${marcoPath(projectId, marcoId)}/enviar-revisao`, {}));
}

export async function reviewMarco(projectId, marcoId, { acao, comentario } = {}) {
  return mapMarco(await api.post(`${marcoPath(projectId, marcoId)}/revisao`, { acao, comentario }));
}

export async function listRevisoes(projectId, marcoId) {
  const payload = await api.get(`${marcoPath(projectId, marcoId)}/revisoes`);
  return Array.isArray(payload) ? payload.map(mapRevisao).filter(Boolean) : [];
}

export const progressService = {
  getProgressSummary,
  listMarcos,
  createMarco,
  updateMarco,
  deleteMarco,
  reorderMarcos,
  createTarefa,
  updateTarefa,
  toggleTarefa,
  deleteTarefa,
  reorderTarefas,
  submitMarcoForReview,
  reviewMarco,
  listRevisoes,

  async getProgress(projectId) {
    try {
      const payload = await api.get(`/api/projects/${projectId}/progress`);
      return normalizeSummary(payload);
    } catch (error) {
      const [project, legacyStages, legacyUpdates] = await Promise.all([
        projectService.getById(projectId).catch(() => null),
        etapaService.list(projectId).catch(() => []),
        api.get(`/api/projetos/${projectId}/progresso`).catch(() => []),
      ]);

      const updates = mapLegacyUpdates(legacyUpdates);
      const stepsFromStages = Array.isArray(legacyStages)
        ? legacyStages.map(normalizeLegacyStage).filter(Boolean)
        : [];
      const steps = stepsFromStages.length > 0 ? stepsFromStages : buildLegacySteps(project, updates);

      return {
        projectId,
        overallPercent: calcOverallFromSteps(steps),
        percentualGeral: calcOverallFromSteps(steps),
        itensConcluidos: 0,
        itensTotal: 0,
        marcosTotal: steps.length,
        marcosConcluidos: steps.filter((step) => step.status === "DONE").length,
        marcosEmRevisao: 0,
        marcosComAtencao: 0,
        atualizacoesTotal: updates.length,
        steps,
        marcos: [],
        updates,
        legacyMode: true,
        fallbackError: error,
      };
    }
  },

  async advanceStep(projectId, stepId, payload = { status: "done" }) {
    try {
      const response = await api.patch(`/api/projects/${projectId}/steps/${stepId}`, payload);
      return {
        step: normalizeStep(response?.step),
        overallPercent: Number(response?.overallPercent ?? 0),
      };
    } catch {
      // Endpoint novo indisponível: etapas sintéticas (DEFAULT_STEPS) não têm
      // linha no backend legado, então não há o que concluir.
      if (String(stepId).startsWith("legacy-")) {
        throw new Error("Seu ambiente ainda está usando o backend legado, que não suporta concluir etapas.");
      }
      const status = String(payload?.status ?? "DONE").toUpperCase();
      const response = await etapaService.complete(projectId, stepId, status);
      return { step: normalizeLegacyStage(response) };
    }
  },

  async deleteUpdate(projectId, updateId) {
    try {
      await api.delete(`/api/projects/${projectId}/updates/${updateId}`);
    } catch {
      await api.delete(`/api/projetos/${projectId}/progresso/${updateId}`);
    }
  },

  async editUpdate(projectId, updateId, payload) {
    const requestPayload = {
      titulo: payload?.titulo,
      descricao: payload?.descricao,
      categoria: payload?.categoria ?? payload?.category,
      etapaId: payload?.etapaId ?? payload?.stepId ?? null,
      etapaContribuicao: payload?.etapaContribuicao,
      dataRegistro: payload?.dataRegistro,
      semData: payload?.semData,
    };
    try {
      const response = await api.put(`/api/projects/${projectId}/updates/${updateId}`, requestPayload);
      return normalizeUpdate(response);
    } catch {
      const stepId = payload?.stepId ?? payload?.etapaId ?? null;
      const stepTitle = payload?.stepName ?? payload?.stepTitle ?? payload?.etapaTitulo ?? null;
      const category = payload?.category ?? payload?.categoria ?? "progress";
      const legacyPayload = {
        titulo: payload?.titulo,
        descricao: payload?.descricao,
        tipo: category === "milestone" ? "MARCO" : category === "problem" ? "BLOQUEIO" : "ATUALIZACAO",
        fase: stepTitle || (stepId ? "Etapa vinculada" : null),
        metadataJson: JSON.stringify({
          ...(stepId ? { stepId } : {}),
          ...(stepTitle ? { stepTitle } : {}),
          ...(payload?.dataRegistro ? { dataRegistro: payload.dataRegistro } : {}),
        }),
      };
      const response = await api.put(`/api/projetos/${projectId}/progresso/${updateId}`, legacyPayload);
      return normalizeUpdate({
        id: response?.id ?? updateId,
        title: response?.titulo ?? payload?.titulo,
        description: response?.descricao ?? payload?.descricao,
        category,
        stepId,
        stepTitle,
        createdBy: response?.autor ?? response?.usuario ?? null,
        createdAt: response?.dataRegistro ?? payload?.dataRegistro,
        metadataJson: response?.metadataJson,
      });
    }
  },

  async createUpdate(projectId, payload) {
    try {
      const requestPayload = {
        titulo: payload?.titulo,
        descricao: payload?.descricao,
        categoria: payload?.categoria ?? payload?.category,
        etapaId: payload?.etapaId ?? payload?.stepId ?? null,
        etapaContribuicao: payload?.etapaContribuicao,
        dataRegistro: payload?.dataRegistro,
        semData: payload?.semData,
      };
      const response = await api.post(`/api/projects/${projectId}/updates`, requestPayload);
      return normalizeUpdate(response);
    } catch {
      const stepId = payload?.stepId ?? payload?.etapaId ?? null;
      const stepTitle = payload?.stepName ?? payload?.stepTitle ?? payload?.etapaTitulo ?? null;
      const category = payload?.category ?? payload?.categoria ?? "progress";
      const legacyPayload = {
        titulo: payload?.titulo,
        descricao: payload?.descricao,
        tipo: category === "milestone" ? "MARCO" : category === "problem" ? "BLOQUEIO" : "ATUALIZACAO",
        fase: stepTitle || (stepId ? "Etapa vinculada" : null),
        metadataJson: JSON.stringify({
          ...(stepId ? { stepId } : {}),
          ...(stepTitle ? { stepTitle } : {}),
          ...(payload?.dataRegistro ? { dataRegistro: payload.dataRegistro } : {}),
        }),
      };

      const response = await api.post(`/api/projetos/${projectId}/progresso`, legacyPayload);
      return normalizeUpdate({
        id: response?.id,
        title: response?.titulo,
        description: response?.descricao,
        category,
        stepId,
        stepTitle,
        createdBy: response?.autor ?? response?.usuario ?? (response?.autorId || response?.autorNome ? { id: response?.autorId, nome: response?.autorNome } : null),
        createdAt: response?.dataRegistro ?? payload?.dataRegistro,
        metadataJson: response?.metadataJson,
      });
    }
  },
};

export { normalizeStep, normalizeUpdate, normalizeSummary };
