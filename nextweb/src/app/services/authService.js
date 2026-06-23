import { api } from "./api";

export const authService = {
  login(payload) {
    return api.post("/api/auth/login", payload);
  },
  register(payload) {
    return api.post("/api/auth/register", payload);
  },
  logout() {
    return api.post("/api/auth/logout");
  },
};
