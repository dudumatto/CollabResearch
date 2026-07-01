import { expect, type APIRequestContext, type Page } from "@playwright/test";
import { buildLoginCandidate } from "../../factories/auth.factory";
import { LoginPage } from "../../pages/LoginPage";
import { E2E_PASSWORD } from "../../helpers/test-data.helper";

const API_URL = process.env.VITE_API_URL ?? "http://127.0.0.1:8080";

export async function preparePublicProfileUser(request: APIRequestContext) {
  const user = buildLoginCandidate();
  const response = await request.post(`${API_URL}/api/auth/register`, {
    data: { nome: user.nome, email: user.email, senha: user.senha, ra: user.ra },
  });
  expect([200, 409]).toContain(response.status());

  const meRes = await request.post(`${API_URL}/api/auth/login`, {
    data: { email: user.email, senha: user.senha },
  });
  expect(meRes.ok()).toBeTruthy();
  const auth = await meRes.json();
  const me = await request.get(`${API_URL}/api/usuarios/me`, {
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  expect(me.ok()).toBeTruthy();
  const profile = await me.json();
  return { email: user.email, password: E2E_PASSWORD, userId: Number(profile.id) };
}

export async function loginAsDifferentUser(page: Page, request: APIRequestContext) {
  const otherUser = buildLoginCandidate();
  const res = await request.post(`${API_URL}/api/auth/register`, {
    data: { nome: otherUser.nome, email: otherUser.email, senha: otherUser.senha, ra: otherUser.ra },
  });
  expect([200, 409]).toContain(res.status());
  const loginPage = new LoginPage(page);
  await loginPage.login(otherUser.email, otherUser.senha);
  return otherUser;
}

export async function openUserProfile(page: Page, userId: number) {
  await page.goto(`/app/users/${userId}`);
  await expect(page.locator(".cartao-perfil__nome")).toBeVisible();
}

export async function assertProfileNameVisible(page: Page, name: string) {
  await expect(page.locator(".cartao-perfil__nome").first()).toContainText(name);
}

export async function assertProfileTypeVisible(page: Page) {
  await expect(page.locator(".cartao-perfil__tipo")).toBeVisible();
}

export async function assertInvalidUserShowsError(page: Page) {
  await page.goto("/app/users/999999");
  await expect(page.getByText(/não encontrado|indisponível/i)).toBeVisible();
}
