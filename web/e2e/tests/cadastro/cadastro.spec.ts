import { test, expect } from "@playwright/test";
import { assertUserPersistedIfDbConfigured, runCadastroFlow, runCadastroPasswordMismatchFlow } from "./cadastro.robot";
import { cleanupTestData } from "../../helpers/database-cleanup.helper";
import { verifyTestProfile, setupAdmin } from "../../helpers/journey.helper";

const API_URL = process.env.E2E_API_URL ?? process.env.VITE_API_URL ?? "http://127.0.0.1:8080";

test.describe("cadastro real", () => {
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

  test("cadastro cria conta via backend real e entra no app", async ({ page }) => {
    const user = await runCadastroFlow(page);
    await expect(page.getByRole("heading", { name: "Dashboard", exact: true })).toBeVisible();
    await expect.poll(() => page.evaluate(() => localStorage.getItem("tcc_auth_token"))).not.toBeNull();
    await assertUserPersistedIfDbConfigured(user.email);
  });

  test("cadastro valida senha divergente", async ({ page }) => {
    await runCadastroPasswordMismatchFlow(page);
  });
});