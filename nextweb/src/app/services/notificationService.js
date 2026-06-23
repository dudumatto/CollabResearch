import { api } from "./api";

export const notificationService = {
  listMine() {
    return api.get("/api/notificacoes");
  },
  markAsRead(id) {
    return api.put(`/api/notificacoes/${id}/ler`);
  },
  markAllAsRead() {
    return api.put("/api/notificacoes/ler-todas");
  },
};
