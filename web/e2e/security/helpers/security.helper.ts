import { expect, type APIRequestContext } from "@playwright/test";
import { buildLoginCandidate } from "../../factories/auth.factory";
import { API_URL } from "../../helpers/api.helper";
import type { TestUser } from "../../helpers/test-data.helper";

export type AuthenticatedUser = TestUser & { id: number; token: string };

export async function registerAndLogin(request: APIRequestContext, prefix: string): Promise<AuthenticatedUser> {
  const user = buildLoginCandidate(prefix);
  const registerRes = await request.post(`${API_URL}/api/auth/register`, {
    data: { nome: user.nome, email: user.email, senha: user.senha, ra: user.ra },
  });
  expect([200, 409]).toContain(registerRes.status());

  const loginRes = await request.post(`${API_URL}/api/auth/login`, {
    data: { email: user.email, senha: user.senha },
  });
  expect(loginRes.ok(), `Login failed for ${user.email}`).toBeTruthy();
  const auth = await loginRes.json();
  const userId = Number(auth.user?.id ?? auth.usuario?.id ?? auth.id);
  expect(userId).toBeGreaterThan(0);

  return { ...user, id: userId, token: auth.token };
}

export async function registerAndLoginOrientador(request: APIRequestContext, prefix: string): Promise<AuthenticatedUser> {
  const user = buildLoginCandidate(prefix);
  const registerRes = await request.post(`${API_URL}/api/auth/register`, {
    data: {
      nome: user.nome,
      email: user.email,
      senha: user.senha,
      tipo: "ORIENTADOR",
      departamento: "Ciência da Computação",
      titulacao: "Doutor",
    },
  });
  expect([200, 409]).toContain(registerRes.status());

  const loginRes = await request.post(`${API_URL}/api/auth/login`, {
    data: { email: user.email, senha: user.senha },
  });
  expect(loginRes.ok(), `Login failed for orientador ${user.email}`).toBeTruthy();
  const auth = await loginRes.json();
  const userId = Number(auth.user?.id ?? auth.usuario?.id ?? auth.id);
  expect(userId).toBeGreaterThan(0);

  return { ...user, id: userId, token: auth.token };
}

export async function assertUnauthorized(response: { status: () => number; text: () => Promise<string> }): Promise<void> {
  expect(response.status(), await response.text()).toBe(401);
}

export async function assertForbidden(response: { status: () => number; text: () => Promise<string> }): Promise<void> {
  expect(response.status(), await response.text()).toBe(403);
}

export async function assertOk(response: { status: () => number; text: () => Promise<string> }): Promise<void> {
  expect(response.status(), await response.text()).toBe(200);
}

export async function assertCreated(response: { status: () => number; text: () => Promise<string> }): Promise<void> {
  expect(response.status(), await response.text()).toBe(201);
}
