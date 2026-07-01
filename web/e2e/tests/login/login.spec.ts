import { test, expect } from "@playwright/test";
import { runInvalidLoginFlow, runLandingToLogin, runLoginFlow, prepareLoginUser, runLogoutAndAssertRevoked } from "./login.robot";
import { cleanupTestData } from "../../helpers/database-cleanup.helper";
import { verifyTestProfile, setupAdmin } from "../../helpers/journey.helper";

const API_URL = process.env.E2E_API_URL ?? process.env.VITE_API_URL ?? "http://127.0.0.1:8080";

test.describe("login real", () => {
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
  });

  test.afterEach(async ({ request }) => {
    if (adminToken) await cleanupTestData(request, adminToken);
  });

  test("landing direciona para tela de login", async ({ page }) => {
    await runLandingToLogin(page);
  });

  test("usuario valido autentica no frontend via backend real", async ({ page, request }) => {
    const user = await prepareLoginUser(request);
    await runLoginFlow(page, user.email, user.senha);
    await expect.poll(() => page.evaluate(() => localStorage.getItem("tcc_auth_token"))).not.toBeNull();
  });

  test("usuario invalido recebe erro de autenticacao", async ({ page }) => {
    await runInvalidLoginFlow(page);
  });

  test("logout invalida token real no backend", async ({ page, request }) => {
    const user = await prepareLoginUser(request);
    await runLoginFlow(page, user.email, user.senha);
    const token = await page.evaluate(() => localStorage.getItem("tcc_auth_token"));
    expect(token).toBeTruthy();
    await runLogoutAndAssertRevoked(request, token!);
  });
});