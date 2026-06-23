import { api } from "./api";

export const applicationService = {
  listMine() {
    return api.get("/api/usuarios/minhas-inscricoes");
  },
  create(projectId, motivacao = "") {
    return api.post("/api/inscricoes", {
      projetoId: Number(projectId),
      motivacao: motivacao || undefined,
    });
  },
  listByProject(projectId) {
    return api.get(`/api/inscricoes/projeto/${projectId}`);
  },
  approve(inscricaoId, parecerOrientador = "") {
    return api.put(`/api/inscricoes/${inscricaoId}/aprovar`, {
      parecerOrientador: parecerOrientador || undefined,
    });
  },
  reject(inscricaoId, parecerOrientador = "") {
    return api.put(`/api/inscricoes/${inscricaoId}/rejeitar`, {
      parecerOrientador: parecerOrientador || undefined,
    });
  },
  cancel(inscricaoId) {
    return api.delete(`/api/inscricoes/${inscricaoId}/cancelar`);
  },
};
