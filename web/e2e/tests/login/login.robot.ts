import { expect, type APIRequestContext, type Page } from "@playwright/test";
import { LoginPage } from "../../pages/LoginPage";
import { buildLoginCandidate } from "../../factories/auth.factory";
import { ApiHelper } from "../../helpers/api.helper";

export async function prepareLoginUser(request: APIRequestContext) {
  const user = buildLoginCandidate();
  const response = await request.post(`${process.env.VITE_API_URL ?? "http://127.0.0.1:8080"}/api/auth/register`, {
    data: {
      nome: user.nome,
      email: user.email,
      senha: user.senha,
      ra: user.ra,
    },
  });
  expect([200, 409]).toContain(response.status());
  return user;
}

export async function runLoginFlow(page: Page, email: string, password: string) {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.expectVisible();
  await loginPage.fillForm(email, password);
  await loginPage.submit();
  await expect(page.getByRole("heading", { name: "Dashboard", exact: true })).toBeVisible();
}

export async function runInvalidLoginFlow(page: Page) {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.expectVisible();
  await loginPage.fillForm("invalido@e2e.local", "senha-invalida");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByText(/credenciais|invalid/i)).toBeVisible();
}

export async function runLandingToLogin(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Entrar" }).first().click();
  await expect(page).toHaveURL(/\/login$/);
}

export async function runLogoutAndAssertRevoked(request: APIRequestContext, token: string) {
  const api = new ApiHelper(request);
  await api.logout(token);
  await api.expectTokenRevoked(token);
}
