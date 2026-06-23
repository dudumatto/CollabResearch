import { api } from "./api";

export const feedbackService = {
  listByProject(projectId) {
    return api.get(`/api/feedback/projeto/${projectId}`);
  },
  listByUser(userId) {
    return api.get(`/api/feedback/usuario/${userId}`);
  },
  create(payload) {
    return api.post("/api/feedback", payload);
  },
};
