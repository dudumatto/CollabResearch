import { expect, type APIRequestContext, type Page } from "@playwright/test";
import { buildLoginCandidate } from "../../factories/auth.factory";
import { buildProjectCandidate } from "../../factories/project.factory";
import { LoginPage } from "../../pages/LoginPage";
import { ApiHelper } from "../../helpers/api.helper";

const API_URL = process.env.VITE_API_URL ?? "http://127.0.0.1:8080";

export async function prepareAuthenticatedUser(request: APIRequestContext) {
  const user = buildLoginCandidate();
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
  expect([200, 409]).toContain(response.status());
  return user;
}

export async function runLoginForProjects(page: Page, user: { email: string; senha: string }) {
  const loginPage = new LoginPage(page);
  await loginPage.login(user.email, user.senha);
}

export async function runCreateProjectFlow(page: Page) {
  const draft = buildProjectCandidate();
  await page.goto("/app/projects/new");
  await page.getByPlaceholder("Ex: Sistema de deteccao de anomalias com IA").fill(draft.title);
  await page.getByPlaceholder("Descreva os objetivos, metodologia e resultados esperados...").fill(draft.description);
  await page.getByPlaceholder("Ex: Conhecimento em Python, estatística básica").fill(draft.requirements);
  await page.getByPlaceholder("Ex: React, Spring Boot, PostgreSQL").fill(draft.technologies);
  await page.locator("#areaId").selectOption({ index: 1 });
  const advisorSelect = page.locator("#orientadorId");
  if (await advisorSelect.isVisible()) {
    await advisorSelect.selectOption({ index: 1 });
  }
  await page.getByPlaceholder("Ex: 3").fill(String(draft.slots));
  await page.getByRole("button", { name: "Criar projeto" }).click();
  await expect(page).toHaveURL(/\/app\/projects\/\d+$/);
  await expect(page.getByRole("heading", { name: draft.title })).toBeVisible();
  return draft;
}

export async function assertProjectPersistedViaApi(
  request: APIRequestContext,
  token: string,
  projectId: number,
  draft: ReturnType<typeof buildProjectCandidate>,
) {
  const api = new ApiHelper(request);
  const project = await api.get<{ titulo: string; requisitos: string; tecnologias: string }>(`/api/projetos/${projectId}`, token);
  expect(project.titulo).toBe(draft.title);
  expect(project.requisitos).toBe(draft.requirements);
  expect(project.tecnologias).toBe(draft.technologies);
}

export async function runOpenProjectAndFilter(page: Page, title: string) {
  await page.goto("/app/projects");
  await page.getByPlaceholder("Buscar projetos por titulo, area ou tecnologia...").fill(title);
  await expect(page.getByText(title).first()).toBeVisible();
  await page.getByText(title).first().click();
  await expect(page).toHaveURL(/\/app\/projects\/\d+$/);
}

export async function createApplicationViaApi(request: APIRequestContext, token: string, projectId: number) {
  const learner = buildLoginCandidate();
  await request.post(`${API_URL}/api/auth/register`, {
    data: { nome: learner.nome, email: learner.email, senha: learner.senha, ra: learner.ra },
  });
  const login = await request.post(`${API_URL}/api/auth/login`, {
    data: { email: learner.email, senha: learner.senha },
  });
  expect(login.ok()).toBeTruthy();
  const auth = await login.json();
  const learnerToken = auth.token as string;
  const app = await request.post(`${API_URL}/api/inscricoes`, {
    headers: { Authorization: `Bearer ${learnerToken}` },
    data: { projetoId: projectId, motivacao: "Inscrição E2E" },
  });
  expect(app.ok()).toBeTruthy();
}

export async function approveOrRejectFromUi(page: Page, projectId: number, approve: boolean) {
  await page.goto(`/app/projects/${projectId}/applications`);
  if (await page.getByText(/acesso negado/i).isVisible()) return false;
  const button = approve
    ? page.getByRole("button", { name: /aprovar/i }).first()
    : page.getByRole("button", { name: /rejeitar/i }).first();
  if (!(await button.isVisible())) return false;
  await button.click();
  await page.getByRole("button", { name: /confirmar/i }).click();
  return true;
}

export async function deleteProjectViaApi(request: APIRequestContext, token: string, projectId: number) {
  const res = await request.delete(`${API_URL}/api/projetos/${projectId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect([200, 204]).toContain(res.status());
}

export async function expectApplicationsRouteForbidden(page: Page, projectId: number) {
  await page.goto(`/app/projects/${projectId}/applications`);
  await expect(page.getByText(/acesso negado/i)).toBeVisible();
}

export async function openProjectAndReload(page: Page, projectId: number, title: string) {
  await page.goto(`/app/projects/${projectId}`);
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
}
