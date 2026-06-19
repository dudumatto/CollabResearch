import { expect, type APIRequestContext, type Page } from "@playwright/test";
import { buildLoginCandidate } from "../../factories/auth.factory";
import { buildProfileUpdate } from "../../factories/profile.factory";
import { LoginPage } from "../../pages/LoginPage";

const API_URL = process.env.VITE_API_URL ?? "http://127.0.0.1:8080";

export async function prepareProfileUser(request: APIRequestContext) {
  const user = buildLoginCandidate();
  const register = await request.post(`${API_URL}/api/auth/register`, {
    data: { nome: user.nome, email: user.email, senha: user.senha, ra: user.ra },
  });
  expect([200, 409]).toContain(register.status());
  return user;
}

export async function loginAndOpenProfile(page: Page, user: { email: string; senha: string }) {
  const loginPage = new LoginPage(page);
  await loginPage.login(user.email, user.senha);
  await page.goto("/app/profile");
  await expect(page.getByText(/informações do perfil/i)).toBeVisible();
}

export async function updateProfileFields(page: Page) {
  const payload = buildProfileUpdate();
  await page.getByRole("button", { name: /editar perfil/i }).click();
  const fields = page.locator(".secao-perfil__grade-campos input");
  await fields.nth(0).fill(payload.nome);
  await fields.nth(2).fill(payload.curso);
  await fields.nth(3).fill(payload.instituicao);
  await fields.nth(4).fill(payload.semestre);
  await page.locator(".campo-perfil__bio").fill(payload.bio);
  await page.getByRole("button", { name: /salvar/i }).click();
  await expect(fields.nth(0)).toHaveValue(payload.nome);
  return payload;
}

export async function assertProfileApi(request: APIRequestContext, token: string, expectedName: string) {
  const me = await request.get(`${API_URL}/api/usuarios/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(me.ok()).toBeTruthy();
  const body = await me.json();
  expect(String(body.nome)).toContain(expectedName.slice(0, 10));
}

export async function reloadProfileAndAssert(page: Page, expectedName: string) {
  await page.reload();
  const fields = page.locator(".secao-perfil__grade-campos input");
  await expect(fields.nth(0)).toHaveValue(expectedName);
}
