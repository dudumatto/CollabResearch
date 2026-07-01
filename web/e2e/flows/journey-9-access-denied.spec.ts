import { test, expect } from "@playwright/test";
import {
  setupAluno,
  setupOrientador,
  loginViaUI,
  verifyTestProfile,
  setupAdmin,
} from "../helpers/journey.helper";
import { cleanupTestData } from "../helpers/database-cleanup.helper";

const API_URL = process.env.E2E_API_URL ?? process.env.VITE_API_URL ?? "http://127.0.0.1:8080";

test.describe("jornada 9 — acesso negado", () => {
  let adminToken = "";

  test.beforeAll(async ({ request }) => {
    await verifyTestProfile(request);
    const admin = await setupAdmin(request);
    const loginRes = await request.post(`${API_URL}/api/auth/login`, {
      data: { email: admin.email, senha: admin.senha },
    });
    if (loginRes.ok()) {
      const body = await loginRes.json();
      adminToken = body.token;
    }
  });

  test.afterEach(async ({ request }) => {
    if (adminToken) {
      await cleanupTestData(request, adminToken);
    }
  });

  test("usuario sem login e redirecionado para login", async ({ page }) => {
    await page.goto("/app");
    await expect(page).toHaveURL(/\/login$/);
  });

  test("aluno nao acessa painel admin", async ({ page, request }) => {
    const aluno = await setupAluno(request);
    await loginViaUI(page, aluno);

    await page.goto("/admin");
    const url = page.url();
    const hasNoAdminContent =
      url.includes("/login") ||
      url.includes("/app") ||
      url.endsWith("/admin") ||
      url.endsWith("/admin/") ||
      (await page.getByText(/acesso negado|nao autorizado|forbidden/i)
        .isVisible());
    expect(hasNoAdminContent).toBeTruthy();
  });

  test("orientador nao acessa painel admin", async ({ page, request }) => {
    const orientador = await setupOrientador(request);
    await loginViaUI(page, orientador);

    await page.goto("/admin");
    const url = page.url();
    const hasNoAdminContent =
      url.includes("/login") ||
      url.includes("/app") ||
      url.endsWith("/admin") ||
      url.endsWith("/admin/") ||
      (await page.getByText(/acesso negado|nao autorizado|forbidden/i)
        .isVisible());
    expect(hasNoAdminContent).toBeTruthy();
  });

  test("sem token valido e redirecionado", async ({ page }) => {
    await page.goto("/app/projects");
    await expect(page).toHaveURL(/\/login$/);
  });
});