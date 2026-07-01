import { test as base, expect, type APIRequestContext } from "@playwright/test";
import { buildTestUser, type TestUser } from "../helpers/test-data.helper";
import { cleanupTestData } from "../helpers/database-cleanup.helper";

const API_URL = process.env.E2E_API_URL ?? process.env.VITE_API_URL ?? "http://127.0.0.1:8080";

type Fixtures = {
  adminToken: string;
  e2eUser: TestUser;
};

export const test = base.extend<Fixtures>({
  adminToken: [async ({ request }, use) => {
    const adminRes = await request.post(`${API_URL}/api/auth/register`, {
      data: {
        nome: "Admin Fixture",
        email: `admin-fixture-${Date.now()}@e2e.local`,
        senha: "Admin123!",
        tipo: "ADMIN",
      },
    });
    let token = "";
    if (adminRes.ok()) {
      const body = await adminRes.json();
      token = body.token;
    } else {
      const loginRes = await request.post(`${API_URL}/api/auth/login`, {
        data: {
          email: `admin-fixture-${Date.now()}@e2e.local`,
          senha: "Admin123!",
        },
      });
      if (loginRes.ok()) {
        const body = await loginRes.json();
        token = body.token;
      }
    }
    await use(token);
    if (token) {
      await cleanupTestData(request, token);
    }
  }, { scope: "test" }],

  e2eUser: [async ({ request }, use) => {
    const user = buildTestUser("fixture-user", "Fixture User E2E");
    await request.post(`${API_URL}/api/auth/register`, {
      data: {
        nome: user.nome,
        email: user.email,
        senha: user.senha,
        ra: user.ra,
      },
    });
    await use(user);
  }, { scope: "test" }],
});

export { expect };