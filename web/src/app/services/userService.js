import { api } from "./api";

export const userService = {
  list() {
    return api.get("/api/usuarios");
  },
  listAdvisors() {
    return api.get("/api/usuarios/orientadores");
  },
  getCurrentUser() {
    return api.get("/api/usuarios/me");
  },
  getById(id) {
    return api.get(`/api/usuarios/${id}`);
  },
  getProfileById(id) {
    return api.get(`/api/usuarios/${id}/perfil`);
  },
  update(id, payload) {
    return api.put(`/api/usuarios/${id}`, payload);
  },
  updatePreferencias(payload) {
    return api.put("/api/usuarios/me/preferencias", payload);
  },
  uploadProfilePhoto(file) {
    const formData = new FormData();
    formData.append("arquivo", file);
    return api.post("/api/usuarios/me/foto-perfil", formData);
  },
  getProjects(id) {
    return api.get(`/api/usuarios/${id}/projetos`);
  },
  getApplications(id) {
    return api.get(`/api/usuarios/${id}/inscricoes`);
  },
  getDocuments(id) {
    return api.get(`/api/documentos/usuario/${id}`);
  },
};
