import { test, expect } from "@playwright/test";
import { prepareValidationUser, xssPayloads } from "../payloads.helper";
import { API_URL } from "../../../helpers/api.helper";
import { buildProjectCandidate } from "../../../factories/project.factory";
import { cleanupTestData } from "../../../helpers/database-cleanup.helper";
import { verifyTestProfile, setupAdmin } from "../../../helpers/journey.helper";

test.describe("XSS payloads", () => {
  let token: string;
  let projectId: number;
  let userId: number;
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
    userId = user.id;

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
  });

  test.afterEach(async ({ request }) => {
    if (adminToken) await cleanupTestData(request, adminToken);
  });

  for (const payload of xssPayloads()) {
    test(`POST /api/auth/register com XSS "${payload.slice(0, 20)}..." não retorna 500`, async ({ request }) => {
      const uniqueEmail = `xss-${Date.now()}-${Math.random().toString(16).slice(2)}@test.com`;
      const response = await request.post(`${API_URL}/api/auth/register`, {
        data: { nome: payload, email: uniqueEmail, senha: "12345678", ra: "123" },
      });
      expect(response.status(), `XSS retornou 500`).not.toBe(500);
      expect([200, 400, 403, 409]).toContain(response.status());
    });
  }

  for (const payload of xssPayloads()) {
    test(`POST /api/feedback com XSS no comentário "${payload.slice(0, 20)}..." não retorna 500`, async ({ request }) => {
      const response = await request.post(`${API_URL}/api/feedback`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { projectId, nota: 5, comentario: payload },
      });
      expect(response.status(), `XSS retornou 500`).not.toBe(500);
    });
  }

  for (const payload of xssPayloads()) {
    test(`PUT /api/usuarios/me com XSS no nome "${payload.slice(0, 20)}..." não retorna 500`, async ({ request }) => {
      const response = await request.put(`${API_URL}/api/usuarios/me/preferencias`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { nome: payload },
      });
      expect(response.status(), `XSS retornou 500`).not.toBe(500);
    });
  }
});