import { test, expect } from "@playwright/test";
import { prepareValidationUser, malformedJsonPayloads, sendMalformedJsonWithAuth } from "../payloads.helper";
import { cleanupTestData } from "../../../helpers/database-cleanup.helper";
import { verifyTestProfile, setupAdmin } from "../../../helpers/journey.helper";

const API_URL = process.env.E2E_API_URL ?? process.env.VITE_API_URL ?? "http://127.0.0.1:8080";

test.describe("malformed JSON", () => {
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

  const endpoints = [
    { path: "/api/projetos", method: "POST" },
    { path: "/api/feedback", method: "POST" },
    { path: "/api/inscricoes", method: "POST" },
  ];

  for (const endpoint of endpoints) {
    for (const payload of malformedJsonPayloads()) {
      test(`${endpoint.method} ${endpoint.path} com JSON malformado "${payload.slice(0, 30)}..." não retorna 500`, async ({ request }) => {
        const response = await sendMalformedJsonWithAuth(request, token, endpoint.path, payload);
        expect(response.status(), `Malformed JSON retornou 500`).not.toBe(500);
        expect([400, 415, 422]).toContain(response.status());
      });
    }
  }
});