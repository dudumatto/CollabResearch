import { test, expect } from "@playwright/test";
import { runInvalidLoginFlow, runLandingToLogin, runLoginFlow, prepareLoginUser, runLogoutAndAssertRevoked } from "./login.robot";

test.describe("login real", () => {
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
