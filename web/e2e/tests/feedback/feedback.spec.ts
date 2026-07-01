import { test, expect } from "@playwright/test";
import { assertFeedbackApi, openFeedback, prepareFeedbackContext, submitFeedback } from "./feedback.robot";
import { cleanupTestData } from "../../helpers/database-cleanup.helper";
import { verifyTestProfile, setupAdmin } from "../../helpers/journey.helper";

const API_URL = process.env.E2E_API_URL ?? process.env.VITE_API_URL ?? "http://127.0.0.1:8080";

test.describe("feedback real", () => {
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

  test("envia feedback e valida retorno real", async ({ page, request }) => {
    const ctx = await prepareFeedbackContext(request);
    await openFeedback(page, ctx.user);
    await submitFeedback(page);

    const token = await page.evaluate(() => localStorage.getItem("tcc_auth_token"));
    expect(token).toBeTruthy();
    const meRes = await request.get(`${API_URL}/api/usuarios/me`, { headers: { Authorization: `Bearer ${token}` } });
    expect(meRes.ok()).toBeTruthy();
    const me = await meRes.json();
    await assertFeedbackApi(request, token!, Number(me.id));
  });
});