import { test, expect } from "@playwright/test";
import { prepareValidationUser, sendMalformedJsonWithAuth } from "../payloads.helper";
import { API_URL } from "../../../helpers/api.helper";
import { cleanupTestData } from "../../../helpers/database-cleanup.helper";
import { verifyTestProfile, setupAdmin } from "../../../helpers/journey.helper";

test.describe("campos obrigatórios", () => {
  let token: string;
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
  });

  test.afterEach(async ({ request }) => {
    if (adminToken) await cleanupTestData(request, adminToken);
  });

  test("POST /api/projetos com body vazio retorna 400", async ({ request }) => {
    const response = await request.post(`${API_URL}/api/projetos`, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      data: {},
    });
    expect([400, 422]).toContain(response.status());
  });

  test("POST /api/auth/register sem nome retorna 400", async ({ request }) => {
    const response = await request.post(`${API_URL}/api/auth/register`, {
      data: { email: "test@test.com", senha: "12345678", ra: "123" },
    });
    expect([400, 422]).toContain(response.status());
  });

  test("POST /api/auth/register sem email retorna 400", async ({ request }) => {
    const response = await request.post(`${API_URL}/api/auth/register`, {
      data: { nome: "Test", senha: "12345678", ra: "123" },
    });
    expect([400, 422]).toContain(response.status());
  });

  test("POST /api/auth/register sem senha retorna 400", async ({ request }) => {
    const response = await request.post(`${API_URL}/api/auth/register`, {
      data: { nome: "Test", email: "test@test.com", ra: "123" },
    });
    expect([400, 422]).toContain(response.status());
  });

  test("POST /api/auth/register com body vazio retorna 400", async ({ request }) => {
    const response = await request.post(`${API_URL}/api/auth/register`, {
      data: {},
    });
    expect([400, 422]).toContain(response.status());
  });
});