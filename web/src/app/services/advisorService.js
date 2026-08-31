import { api } from "./api";

function buildQs(params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") qs.set(k, v);
  });
  const s = qs.toString();
  return s ? `?${s}` : "";
}

export const advisorService = {
  dashboard() {
    return api.get("/api/orientador/dashboard");
  },

  inscricoes({ status, projetoId } = {}) {
    return api.get(`/api/orientador/inscricoes${buildQs({ status, projetoId })}`);
  },

  orientandos({ busca, situacao, projetoId } = {}) {
    return api.get(`/api/orientador/orientandos${buildQs({ busca, situacao, projetoId })}`);
  },

  entregas({ status, projetoId } = {}) {
    return api.get(`/api/orientador/entregas${buildQs({ status, projetoId })}`);
  },

  detalheOrientando(studentId, projectId) {
    return api.get(`/api/orientador/orientandos/${studentId}${buildQs({ projectId })}`);
  },

  perfil() {
    return api.get("/api/orientador/perfil");
  },

  atualizarPerfil(request) {
    return api.patch("/api/orientador/perfil", request);
  },

  // Projetos do escopo do orientador (fonte: findAllPaginado com meusProjetos=true).
  // Retorna a lista completa a partir do payload paginado (content).
  async meusProjetos({ status, busca } = {}) {
    const qs = new URLSearchParams({
      meusProjetos: "true",
      page: "0",
      size: "200",
      sort: "dataCriacao",
      direction: "DESC",
    });
    if (status) qs.set("status", status);
    if (busca) qs.set("busca", busca);

    const payload = await api.get(`/api/projetos/pagina?${qs.toString()}`);
    const content = Array.isArray(payload) ? payload : payload?.content ?? payload?.data ?? [];
    return Array.isArray(content) ? content : [];
  },

  async explorar(filters = {}) {
    const qs = new URLSearchParams({
      page: "0",
      size: "200",
      sort: "dataCriacao",
      direction: "DESC",
    });
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") qs.set(k, v);
    });

    const payload = await api.get(`/api/projetos/pagina?${qs.toString()}`);
    const content = Array.isArray(payload) ? payload : payload?.content ?? payload?.data ?? [];
    return Array.isArray(content) ? content : [];
  },
};
