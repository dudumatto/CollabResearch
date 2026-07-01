import { test, expect } from "@playwright/test";
import { prepareValidationUser, invalidIds, sendGetWithInvalidId, sendDeleteWithInvalidId } from "../payloads.helper";
import { cleanupTestData } from "../../../helpers/database-cleanup.helper";
import { verifyTestProfile, setupAdmin } from "../../../helpers/journey.helper";

const API_URL = process.env.E2E_API_URL ?? process.env.VITE_API_URL ?? "http://127.0.0.1:8080";

test.describe("IDs inválidos", () => {
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

  const resources = [
    { path: "/api/projetos", name: "projetos", methods: ["GET"] as const },
    { path: "/api/documentos", name: "documentos", methods: ["GET"] as const },
    { path: "/api/inscricoes", name: "inscricoes", methods: ["GET"] as const },
    { path: "/api/usuarios", name: "usuarios", methods: ["GET"] as const },
  ];

  for (const resource of resources) {
    for (const id of invalidIds()) {
      test(`GET ${resource.path}/${id} não retorna 500`, async ({ request }) => {
        const response = await sendGetWithInvalidId(request, token, resource.path, id);
        expect(response.status(), `ID inválido ${id} retornou 500`).not.toBe(500);
        expect([400, 404]).toContain(response.status());
      });
    }
  }
});