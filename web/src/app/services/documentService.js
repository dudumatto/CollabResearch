import { api } from "./api";

export const documentService = {
  upload(usuarioId, tipo, nomeArquivo, url) {
    return api.post("/api/documentos/upload", {
      usuarioId,
      tipo,
      nomeArquivo,
      url,
    });
  },

  remove(id) {
    return api.delete(`/api/documentos/${id}`);
  },

  getDocuments(userId) {
    return api.get(`/api/documentos/usuario/${userId}`);
  },
};
