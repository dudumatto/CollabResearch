import { expect, type APIRequestContext, type Page } from "@playwright/test";
import { buildLoginCandidate } from "../../factories/auth.factory";
import { LoginPage } from "../../pages/LoginPage";

const API_URL = process.env.VITE_API_URL ?? "http://127.0.0.1:8080";

export async function prepareDashboardUser(request: APIRequestContext) {
  const user = buildLoginCandidate();
  const register = await request.post(`${API_URL}/api/auth/register`, {
    data: { nome: user.nome, email: user.email, senha: user.senha, ra: user.ra },
  });
  expect([200, 409]).toContain(register.status());
  return user;
}

export async function openDashboard(page: Page, user: { email: string; senha: string }) {
  const loginPage = new LoginPage(page);
  await loginPage.login(user.email, user.senha);
  await expect(page.getByRole("heading", { name: "Dashboard", exact: true })).toBeVisible();
}

export async function assertDashboardApiData(request: APIRequestContext, token: string) {
  const [projects, applications, notifications] = await Promise.all([
    request.get(`${API_URL}/api/projetos`, { headers: { Authorization: `Bearer ${token}` } }),
    request.get(`${API_URL}/api/usuarios/minhas-inscricoes`, { headers: { Authorization: `Bearer ${token}` } }),
    request.get(`${API_URL}/api/notificacoes`, { headers: { Authorization: `Bearer ${token}` } }),
  ]);
  expect(projects.ok()).toBeTruthy();
  expect(applications.ok()).toBeTruthy();
  expect(notifications.ok()).toBeTruthy();
}
