import { test, expect } from "@playwright/test";
import { assertFeedbackApi, openFeedback, prepareFeedbackContext, submitFeedback } from "./feedback.robot";

const API_URL = process.env.VITE_API_URL ?? "http://127.0.0.1:8080";

test.describe("feedback real", () => {
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
