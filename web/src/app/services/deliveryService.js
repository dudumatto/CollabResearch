import { api } from "./api";

export const deliveryService = {
  list(projectId) {
    return api.get(`/api/projetos/${projectId}/entregas`);
  },

  create(projectId, { titulo, categoria, etapaId }, arquivo) {
    const formData = new FormData();
    formData.append("titulo", titulo);
    formData.append("categoria", categoria);
    if (etapaId) formData.append("etapaId", String(etapaId));
    formData.append("arquivo", arquivo);

    return api.post(`/api/projetos/${projectId}/entregas`, formData);
  },

  resubmit(projectId, entregaId, arquivo) {
    const formData = new FormData();
    formData.append("arquivo", arquivo);

    return api.post(`/api/projetos/${projectId}/entregas/${entregaId}/versoes`, formData);
  },

  listVersions(projectId, entregaId) {
    return api.get(`/api/projetos/${projectId}/entregas/${entregaId}/versoes`);
  },

  review(projectId, entregaId, versaoId, { decisao, comentario }) {
    return api.post(`/api/projetos/${projectId}/entregas/${entregaId}/versoes/${versaoId}/revisao`, {
      decisao,
      comentario,
    });
  },

  downloadUrl(projectId, entregaId, versaoId) {
    return `/api/projetos/${projectId}/entregas/${entregaId}/versoes/${versaoId}/download`;
  },
};
