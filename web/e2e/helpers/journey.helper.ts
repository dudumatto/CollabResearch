import { expect, type APIRequestContext, type Page } from "@playwright/test";
import { buildTestUser, type TestUser } from "./test-data.helper";
import { LoginPage } from "../pages/LoginPage";

export const API_URL =
  process.env.E2E_API_URL ??
  process.env.VITE_API_URL ??
  "http://127.0.0.1:8080";

export async function verifyTestProfile(
  request: APIRequestContext
): Promise<void> {
  const response = await request.post(`${API_URL}/api/test/cleanup`, {
    headers: { Authorization: "Bearer dummy" },
  });
  expect(
    response.status(),
    "Backend must run with --spring.profiles.active=test " +
      "(got 404 — cleanup endpoint not available)"
  ).not.toBe(404);
}

export async function setupAluno(
  request: APIRequestContext
): Promise<TestUser> {
  const user = buildTestUser("journey-aluno", "Aluno Jornada E2E");
  const response = await request.post(`${API_URL}/api/auth/register`, {
    data: {
      nome: user.nome,
      email: user.email,
      senha: user.senha,
      ra: user.ra,
    },
  });
  expect(response.status(), await response.text()).toBe(200);
  return user;
}

export async function setupOrientador(
  request: APIRequestContext
): Promise<TestUser> {
  const user = buildTestUser("journey-orient", "Orientador Jornada E2E");
  const response = await request.post(`${API_URL}/api/auth/register`, {
    data: {
      nome: user.nome,
      email: user.email,
      senha: user.senha,
      tipo: "ORIENTADOR",
      departamento: "Computacao",
      titulacao: "Doutor",
    },
  });
  expect(response.status(), await response.text()).toBe(200);
  return user;
}

export async function setupAdmin(
  request: APIRequestContext
): Promise<TestUser> {
  const response = await request.post(`${API_URL}/api/test/admin`);
  expect(response.ok(), "POST /api/test/admin must succeed").toBeTruthy();
  const body = await response.json();
  const email = body.email as string;
  const senha = body.senha as string;
  expect(email).toBeTruthy();
  expect(senha).toBeTruthy();
  return {
    nome: "Admin E2E",
    email,
    senha,
    password: senha,
    ra: "",
  };
}

export async function loginViaUI(page: Page, user: TestUser): Promise<string> {
  const loginPage = new LoginPage(page);
  await loginPage.login(user.email, user.senha);
  const token = await page.evaluate(() =>
    localStorage.getItem("tcc_auth_token")
  );
  expect(token, "Token should be stored after login").toBeTruthy();
  return token!;
}

export async function loginViaApi(
  request: APIRequestContext,
  user: TestUser
): Promise<string> {
  const response = await request.post(`${API_URL}/api/auth/login`, {
    data: { email: user.email, senha: user.senha },
  });
  expect(response.ok(), await response.text()).toBeTruthy();
  const body = await response.json();
  return body.token as string;
}