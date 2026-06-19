import { api } from "./api";

export const courseService = {
  list() {
    return api.get("/api/cursos");
  },
};

