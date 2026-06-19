import { expect, type APIRequestContext, type Page } from "@playwright/test";
import { buildLoginCandidate } from "../../factories/auth.factory";
import { buildDocumentFixture } from "../../factories/document.factory";
import { LoginPage } from "../../pages/LoginPage";

const API_URL = process.env.VITE_API_URL ?? "http://127.0.0.1:8080";

export async function prepareDocumentUser(request: APIRequestContext) {
  const user = buildLoginCandidate();
  const register = await request.post(`${API_URL}/api/auth/register`, {
    data: { nome: user.nome, email: user.email, senha: user.senha, ra: user.ra },
  });
  expect([200, 409]).toContain(register.status());
  return user;
}

export async function loginAndOpenDocuments(page: Page, user: { email: string; senha: string }) {
  const loginPage = new LoginPage(page);
  await loginPage.login(user.email, user.senha);
  await page.goto("/app/documents");
  await expect(page.getByText(/documento/i).first()).toBeVisible();
}

export async function uploadDocument(page: Page) {
  const fixture = buildDocumentFixture();
  const chooser = page.locator('input[type="file"]');
  await chooser.setInputFiles({
    name: fixture.fileName,
    mimeType: "application/pdf",
    buffer: Buffer.from(fixture.content, "utf8"),
  });
  await expect(page.getByText(/documento|curriculo|historico/i).first()).toBeVisible();
}

export async function assertDocumentListedByApi(request: APIRequestContext, token: string, userId: number) {
  const res = await request.get(`${API_URL}/api/documentos/usuario/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(res.ok()).toBeTruthy();
  const list = await res.json();
  expect(Array.isArray(list)).toBeTruthy();
}
