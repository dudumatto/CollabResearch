import { api } from "./api";
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
    completedAt: step.completedAt ?? step.concluidaEm ?? null,
    completedBy: step.completedBy ?? step.concluidaPor ?? null,
  };
}

function normalizeUpdate(update) {
  if (!update) return null;

  const createdBy = update.createdBy ?? update.autor ?? update.usuario ?? null;

  return {
    id: update.id,
    title: update.title ?? update.titulo ?? "AtualizaÃ§Ã£o",
    description: update.description ?? update.descricao ?? "",
    category: String(update.category ?? update.categoria ?? "progress").toLowerCase(),
    stepId: update.stepId ?? update.etapaId ?? null,
    stepTitle: update.stepTitle ?? update.etapaTitle ?? update.etapaTitulo ?? null,
    stepContribution: Number(update.stepContribution ?? update.etapaContribuicao ?? 0),
    createdBy,
    createdAt: update.createdAt ?? update.dataRegistro ?? null,
  };
}

function normalizeSummary(payload) {
  return {
    projectId: payload?.projectId ?? payload?.projetoId ?? null,
    overallPercent: Number(payload?.overallPercent ?? 0),
    steps: Array.isArray(payload?.steps) ? payload.steps.map(normalizeStep).filter(Boolean) : [],
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

export const progressService = {
  async getProgress(projectId) {
    try {
      const payload = await api.get(`/api/projects/${projectId}/progress`);
      return normalizeSummary(payload);
    } catch (error) {
      const [project, legacyUpdates] = await Promise.all([
        projectService.getById(projectId).catch(() => null),
        api.get(`/api/projetos/${projectId}/progresso`).catch(() => []),
      ]);

      const updates = mapLegacyUpdates(legacyUpdates);
      const steps = buildLegacySteps(project, updates);

      return {
        projectId,
        overallPercent: calcOverallFromSteps(steps),
        steps,
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
      throw new Error("Seu ambiente ainda está usando o backend legado, que não suporta concluir etapas.");
    }
  },

  async createUpdate(projectId, payload) {
    try {
      const response = await api.post(`/api/projects/${projectId}/updates`, payload);
      return normalizeUpdate(response);
    } catch {
      const legacyPayload = {
        titulo: payload?.titulo,
        descricao: payload?.descricao,
        tipo: payload?.category === "milestone" ? "MARCO" : payload?.category === "problem" ? "BLOQUEIO" : "ATUALIZACAO",
        fase: payload?.stepId ? "Etapa vinculada" : null,
        metadataJson: payload?.stepId ? JSON.stringify({ stepId: payload.stepId, stepContribution: payload.stepContribution ?? 0 }) : null,
      };

      const response = await api.post(`/api/projetos/${projectId}/progresso`, legacyPayload);
      return normalizeUpdate({
        id: response?.id,
        title: response?.titulo,
        description: response?.descricao,
        category: payload?.category ?? "progress",
        stepId: payload?.stepId ?? null,
        stepTitle: payload?.stepName ?? null,
        stepContribution: payload?.stepContribution ?? 0,
        createdBy: response?.autor ? { id: response.autorId, nome: response.autorNome } : null,
        createdAt: response?.dataRegistro,
      });
    }
  },
};

export { normalizeStep, normalizeUpdate, normalizeSummary };
