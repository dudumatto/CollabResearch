import { test, expect } from "@playwright/test";
import { prepareValidationUser, sqlLikePayloads } from "../payloads.helper";
import { API_URL } from "../../../helpers/api.helper";
import { buildProjectCandidate } from "../../../factories/project.factory";
import { cleanupTestData } from "../../../helpers/database-cleanup.helper";
import { verifyTestProfile, setupAdmin } from "../../../helpers/journey.helper";

test.describe("SQL-like payloads", () => {
  let token: string;
  let projectId: number;
  let conversationId: number;
  let areaId: number;
  let adminToken = "";

  test.beforeAll(async ({ request }) => {
    await verifyTestProfile(request);
    const admin = await setupAdmin(request);
    const res = await request.post(`${API_URL}/api/auth/login`, {
      data: { email: admin.email, senha: admin.senha },
    });
    if (res.ok()) {
      const body = await res.json();
      adminToken = body.token;
    }

    const user = await prepareValidationUser(request);
    token = user.token;

    const areasRes = await request.get(`${API_URL}/api/areas`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const areas = await areasRes.json();
    areaId = areas[0]?.id;

    const draft = buildProjectCandidate();
    const createRes = await request.post(`${API_URL}/api/projetos`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { titulo: draft.title, descricao: draft.description, vagas: draft.slots, areaId },
    });
    const project = await createRes.json();
    projectId = Number(project.id);

    const userB = await (await import("../../helpers/security.helper")).registerAndLogin(request, "sql-chat-b");
    const convRes = await request.post(`${API_URL}/api/conversas/privada/${userB.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const conv = await convRes.json();
    conversationId = Number(conv.id);
  });

  test.afterEach(async ({ request }) => {
    if (adminToken) await cleanupTestData(request, adminToken);
  });

  for (const payload of sqlLikePayloads()) {
    test(`POST /api/auth/login com SQL injection "${payload.slice(0, 20)}..." não retorna 500`, async ({ request }) => {
      const response = await request.post(`${API_URL}/api/auth/login`, {
        data: { email: payload, senha: "12345678" },
      });
      expect(response.status(), `SQL injection retornou 500`).not.toBe(500);
      expect([200, 400, 401, 403]).toContain(response.status());
    });
  }

  for (const payload of sqlLikePayloads()) {
    test(`POST /api/auth/register com SQL injection "${payload.slice(0, 20)}..." não retorna 500`, async ({ request }) => {
      const uniqueEmail = `sql-${Date.now()}-${Math.random().toString(16).slice(2)}@test.com`;
      const response = await request.post(`${API_URL}/api/auth/register`, {
        data: { nome: payload, email: uniqueEmail, senha: "12345678", ra: "123" },
      });
      expect(response.status(), `SQL injection retornou 500`).not.toBe(500);
      expect([200, 400, 403, 409]).toContain(response.status());
    });
  }

  for (const payload of sqlLikePayloads()) {
    test(`GET /api/projetos com SQL injection na busca "${payload.slice(0, 20)}..." não retorna 500`, async ({ request }) => {
      const response = await request.get(`${API_URL}/api/projetos?busca=${encodeURIComponent(payload)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(response.status(), `SQL injection retornou 500`).not.toBe(500);
    });
  }

  for (const payload of sqlLikePayloads()) {
    test(`POST /api/feedback com SQL injection no comentário "${payload.slice(0, 20)}..." não retorna 500`, async ({ request }) => {
      const response = await request.post(`${API_URL}/api/feedback`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { projectId, nota: 5, comentario: payload },
      });
      expect(response.status(), `SQL injection retornou 500`).not.toBe(500);
    });
  }

  for (const payload of sqlLikePayloads()) {
    test(`POST /api/conversas/{id}/mensagem com SQL injection "${payload.slice(0, 20)}..." não retorna 500`, async ({ request }) => {
      const response = await request.post(`${API_URL}/api/conversas/${conversationId}/mensagem`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { conteudo: payload },
      });
      expect(response.status(), `SQL injection retornou 500`).not.toBe(500);
    });
  }
});