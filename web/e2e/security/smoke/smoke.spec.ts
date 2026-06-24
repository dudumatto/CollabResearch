import { test, expect } from "@playwright/test";
import {
  requestWithoutAuth,
  requestWithEmptyToken,
  requestWithBearerEmpty,
  requestWithGarbageToken,
  prepareSmokeUsers,
} from "./smoke.robot";
import { assertUnauthorized, assertForbidden, assertOk } from "../helpers/security.helper";
import { API_URL } from "../../helpers/api.helper";

test.describe("security smoke", () => {
  test("rota protegida sem JWT retorna 401", async ({ request }) => {
    const response = await requestWithoutAuth(request, "/api/usuarios/me");
    await assertUnauthorized(response);
  });

  test("rota protegida com header vazio retorna 401", async ({ request }) => {
    const response = await requestWithEmptyToken(request, "/api/usuarios/me");
    await assertUnauthorized(response);
  });

  test("rota protegida com Bearer vazio retorna 401", async ({ request }) => {
    const response = await requestWithBearerEmpty(request, "/api/usuarios/me");
    await assertUnauthorized(response);
  });

  test("rota protegida com token garbage retorna 401", async ({ request }) => {
    const response = await requestWithGarbageToken(request, "/api/usuarios/me");
    await assertUnauthorized(response);
  });

  test("rota publica /api/health funciona sem auth", async ({ request }) => {
    const response = await request.get(`${API_URL}/api/health`);
    await assertOk(response);
  });

  test("POST /api/projetos sem auth retorna 401", async ({ request }) => {
    const response = await request.post(`${API_URL}/api/projetos`, {
      data: { titulo: "Teste", vagas: 1, areaId: 1 },
    });
    await assertUnauthorized(response);
  });
});
