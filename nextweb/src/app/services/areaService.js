import { api } from "./api";

export const areaService = {
  list() {
    return api.get("/api/areas");
  },
};
