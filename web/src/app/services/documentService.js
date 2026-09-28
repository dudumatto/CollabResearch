import { api } from "./api";

export const documentService = {
  remove(id) {
    return api.delete(`/api/documentos/${id}`);
  },

  getDocuments(userId) {
    return api.get(`/api/documentos/usuario/${userId}`);
  },
};
