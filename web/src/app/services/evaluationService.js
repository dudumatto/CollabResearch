import { api } from "./api";

export const evaluationService = {
  list(projectId) {
    return api.get(`/api/projetos/${projectId}/avaliacoes`);
  },

  create(projectId, request) {
    return api.post(`/api/projetos/${projectId}/avaliacoes`, request);
  },

  update(projectId, avaliacaoId, request) {
    return api.patch(`/api/projetos/${projectId}/avaliacoes/${avaliacaoId}`, request);
  },

  getById(projectId, avaliacaoId) {
    return api.get(`/api/projetos/${projectId}/avaliacoes/${avaliacaoId}`);
  },

  acknowledge(projectId, avaliacaoId, comentarioAluno) {
    return api.post(`/api/projetos/${projectId}/avaliacoes/${avaliacaoId}/ciencia`, { comentarioAluno });
  },
};