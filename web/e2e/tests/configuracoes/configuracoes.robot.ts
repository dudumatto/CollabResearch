import { expect, type APIRequestContext, type Page } from "@playwright/test";
import { buildLoginCandidate } from "../../factories/auth.factory";
import { LoginPage } from "../../pages/LoginPage";

const API_URL = process.env.VITE_API_URL ?? "http://127.0.0.1:8080";

export async function prepareSettingsUser(request: APIRequestContext) {
  const user = buildLoginCandidate();
  const response = await request.post(`${API_URL}/api/auth/register`, {
    data: { nome: user.nome, email: user.email, senha: user.senha, ra: user.ra },
  });
  expect([200, 409]).toContain(response.status());
  return user;
}

export async function loginAndOpenSettings(page: Page, user: { email: string; senha: string }) {
  const loginPage = new LoginPage(page);
  await loginPage.login(user.email, user.senha);
  await page.goto("/app/configuracoes");
  await expect(page.getByRole("heading", { name: "Configurações", exact: true })).toBeVisible();
}

export async function assertSettingsUserVisible(page: Page, userName: string) {
  await expect(page.locator(".cfg-profile-card__name")).toBeVisible();
}

export async function openAccountPanel(page: Page) {
  await page.getByRole("button", { name: /informações da conta/i }).click();
  await expect(page.locator(".cfg-panel__title", { hasText: "Informações da conta" })).toBeVisible();
}

export async function closePanel(page: Page) {
  await page.locator(".cfg-panel__back").click();
}

export async function openAppearancePanel(page: Page) {
  await page.getByRole("button", { name: /aparência/i }).click();
  await expect(page.locator(".cfg-panel__title", { hasText: "Aparência" })).toBeVisible();
}

export async function toggleDarkMode(page: Page) {
  const appearancePanel = page.locator(".cfg-panel");
  await expect(appearancePanel.getByText("Tamanho da fonte")).toBeHidden();
  await appearancePanel.getByRole("radio", { name: /Escuro/ }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme-preference", "dark");
}

export async function assertPageReloadsCorrectly(page: Page) {
  await page.reload();
  await expect(page.getByRole("heading", { name: "Configurações", exact: true })).toBeVisible();
}
