import { api } from "./api";

export const etapaService = {
  list(projectId) {
    return api.get(`/api/projetos/${projectId}/etapas`);
  },

  create(projectId, request) {
    return api.post(`/api/projetos/${projectId}/etapas`, request);
  },

  update(projectId, etapaId, request) {
    return api.put(`/api/projetos/${projectId}/etapas/${etapaId}`, request);
  },

  remove(projectId, etapaId) {
    return api.delete(`/api/projetos/${projectId}/etapas/${etapaId}`);
  },

  complete(projectId, etapaId, status = "DONE") {
    return api.patch(`/api/projetos/${projectId}/etapas/${etapaId}`, { status });
  },
};
