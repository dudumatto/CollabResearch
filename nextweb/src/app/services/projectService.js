import { api } from "./api";

function buildQs(params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") qs.set(k, v);
  });
  const s = qs.toString();
  return s ? `?${s}` : "";
}

function normalizeAreaCollection(payload) {
  const list = Array.isArray(payload) ? payload : payload?.content ?? payload?.data ?? [];

  if (!Array.isArray(list)) {
    return [];
  }

  return list
    .map((area, index) => {
      if (typeof area === "string") {
        return { id: index + 1, nome: area };
      }

      const id = area?.id ?? area?.areaId ?? area?.id_area;
      const nome = area?.nome ?? area?.areaNome ?? area?.descricao;

      return id != null && nome ? { id, nome } : null;
    })
    .filter(Boolean);
}

export const projectService = {
  // findAll
  list(filters = {}) {
    return api.get(`/api/projetos${buildQs(filters)}`);
  },

  // findById
  getById(id) {
    return api.get(`/api/projetos/${id}`);
  },

  // findByStatus
  findByStatus(status) {
    return api.get(`/api/projetos${buildQs({ status })}`);
  },

  // findByArea (por id)
  findByArea(areaId) {
    return api.get(`/api/projetos${buildQs({ areaId })}`);
  },

  // findByAreaNome
  findByAreaNome(area) {
    return api.get(`/api/projetos${buildQs({ area })}`);
  },

  // findByCursoNome
  findByCursoNome(curso) {
    return api.get(`/api/projetos${buildQs({ curso })}`);
  },

  // findByBusca
  findByBusca(busca) {
    return api.get(`/api/projetos${buildQs({ busca })}`);
  },

  async getStudyAreas() {
    const endpoints = ["/api/areas"];

    for (const endpoint of endpoints) {
      try {
        const response = await api.get(endpoint);
        const areas = normalizeAreaCollection(response);
        if (areas.length > 0) {
          return areas;
        }
      } catch {
        // Usa fallback padrão quando o backend não expor um endpoint dedicado.
      }
    }

    return [];
  },

  // create
  create(dto) {
    return api.post("/api/projetos", dto);
  },

  // update
  update(id, dto) {
    return api.put(`/api/projetos/${id}`, dto);
  },

  acceptGuidance(id) {
    return api.put(`/api/projetos/${id}/aceitar-orientacao`);
  },

  rejectGuidance(id) {
    return api.put(`/api/projetos/${id}/rejeitar-orientacao`);
  },

  // delete
  remove(id) {
    return api.delete(`/api/projetos/${id}`);
  },

  // recrutar
  recrutar(projetoId, usuarioId) {
    return api.post(`/api/projetos/${projetoId}/recrutar`, { usuarioId });
  },

  // listarColaboradores
  getCollaborators(id) {
    return api.get(`/api/projetos/${id}/colaboradores`);
  },

  // removerColaborador
  removerColaborador(projetoId, usuarioId) {
    return api.delete(`/api/projetos/${projetoId}/colaboradores/${usuarioId}`);
  },

  // progresso
  addProgress(id, payload) {
    return api.post(`/api/projetos/${id}/progresso`, payload);
  },
  getProgress(id) {
    return api.get(`/api/projetos/${id}/progresso`);
  },
};
