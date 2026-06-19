import { expect, type APIRequestContext, type Page } from "@playwright/test";
import { buildLoginCandidate } from "../../factories/auth.factory";
import { LoginPage } from "../../pages/LoginPage";

const API_URL = process.env.VITE_API_URL ?? "http://127.0.0.1:8080";

export async function prepareNotificationUser(request: APIRequestContext) {
  const user = buildLoginCandidate();
  const response = await request.post(`${API_URL}/api/auth/register`, {
    data: { nome: user.nome, email: user.email, senha: user.senha, ra: user.ra },
  });
  expect([200, 409]).toContain(response.status());
  return user;
}

export async function openNotifications(page: Page, user: { email: string; senha: string }) {
  const loginPage = new LoginPage(page);
  await loginPage.login(user.email, user.senha);
  await page.goto("/app/notifications");
  await expect(page.getByText(/notific/i).first()).toBeVisible();
}

export async function clearNotificationView(page: Page) {
  const clear = page.getByRole("button", { name: /limpar vista local/i });
  if (await clear.isVisible()) {
    await clear.click();
  }
}

export async function assertNotificationsApi(request: APIRequestContext, token: string) {
  const list = await request.get(`${API_URL}/api/notificacoes`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(list.ok()).toBeTruthy();
}
