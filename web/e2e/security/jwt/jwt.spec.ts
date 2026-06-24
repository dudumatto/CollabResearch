import { test, expect } from "@playwright/test";
import {
  prepareJwtScenario,
  logout,
  getMe,
  requestWithToken,
  requestWithoutAuth,
  requestWithGarbageToken,
  requestWithTruncatedToken,
  requestWithTamperedToken,
  requestWithWrongSignature,
} from "./jwt.robot";
import { assertUnauthorized } from "../helpers/security.helper";
import { API_URL } from "../../helpers/api.helper";

test.describe("JWT hardening", () => {
  let scenario: Awaited<ReturnType<typeof prepareJwtScenario>>;

  test.beforeAll(async ({ request }) => {
    scenario = await prepareJwtScenario(request);
  });

  test("token válido retorna 200", async ({ request }) => {
    const response = await getMe(request, scenario.userA.token);
    expect(response.status()).toBe(200);
  });

  test("sem header Authorization retorna 401", async ({ request }) => {
    const response = await requestWithoutAuth(request, "/api/usuarios/me");
    await assertUnauthorized(response);
  });

  test("token garbage retorna 401", async ({ request }) => {
    const response = await requestWithGarbageToken(request, "/api/usuarios/me");
    await assertUnauthorized(response);
  });

  test("token truncado retorna 401", async ({ request }) => {
    const response = await requestWithTruncatedToken(request, scenario.userA.token, "/api/usuarios/me");
    await assertUnauthorized(response);
  });

  test("token com payload alterado retorna 401", async ({ request }) => {
    const response = await requestWithTamperedToken(request, scenario.userA.token, "/api/usuarios/me");
    await assertUnauthorized(response);
  });

  test("token com assinatura inválida retorna 401", async ({ request }) => {
    const response = await requestWithWrongSignature(request, scenario.userA.token, "/api/usuarios/me");
    await assertUnauthorized(response);
  });

  test("token revogado (após logout) retorna 401", async ({ request }) => {
    const freshUser = await (await import("../helpers/security.helper")).registerAndLogin(request, "jwt-revoke");
    await logout(request, freshUser.token);
    const response = await getMe(request, freshUser.token);
    await assertUnauthorized(response);
  });

  test("token de usuário A não acessa dados de usuário B", async ({ request }) => {
    const responseA = await getMe(request, scenario.userA.token);
    const dataA = await responseA.json();
    const responseB = await getMe(request, scenario.userB.token);
    const dataB = await responseB.json();
    expect(dataA.id).not.toBe(dataB.id);
    expect(dataA.email).not.toBe(dataB.email);
  });

  test("token de usuário B não acessa projetos criados por A via IDOR", async ({ request }) => {
    const createRes = await request.post(`${API_URL}/api/projetos`, {
      headers: { Authorization: `Bearer ${scenario.userA.token}` },
      data: { titulo: "Projeto JWT Test", vagas: 1, areaId: 1 },
    });
    const project = await createRes.json();
    const projectId = Number(project.id);

    const response = await request.get(`${API_URL}/api/projetos/${projectId}`, {
      headers: { Authorization: `Bearer ${scenario.userB.token}` },
    });
    expect(response.status()).not.toBe(500);
  });
});
