import { test, expect } from "@playwright/test";
import { prepareValidationUser, sendWrongContentType } from "../payloads.helper";
import { API_URL } from "../../../helpers/api.helper";
import { cleanupTestData } from "../../../helpers/database-cleanup.helper";
import { verifyTestProfile, setupAdmin } from "../../../helpers/journey.helper";

test.describe("content-type inválido", () => {
  let token: string;
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
  });

  test.afterEach(async ({ request }) => {
    if (adminToken) await cleanupTestData(request, adminToken);
  });

  const wrongContentTypes = [
    "text/plain",
    "application/xml",
    "text/html",
    "application/x-www-form-urlencoded",
  ];

  for (const contentType of wrongContentTypes) {
    test(`POST /api/projetos com Content-Type "${contentType}" retorna 400 ou 415`, async ({ request }) => {
      const response = await sendWrongContentType(request, token, "/api/projetos", contentType);
      expect([400, 415, 422]).toContain(response.status());
    });
  }
});