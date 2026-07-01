import { expect, type APIRequestContext, type Page } from "@playwright/test";
import { buildLoginCandidate } from "../../factories/auth.factory";
import { buildProjectCandidate } from "../../factories/project.factory";
import { LoginPage } from "../../pages/LoginPage";

const API_URL = process.env.VITE_API_URL ?? "http://127.0.0.1:8080";

export async function prepareEditableProject(request: APIRequestContext) {
  const owner = buildLoginCandidate();
  const registerRes = await request.post(`${API_URL}/api/auth/register`, {
    data: {
      nome: owner.nome,
      email: owner.email,
      senha: owner.senha,
      tipo: "ORIENTADOR",
      departamento: "Computacao",
      titulacao: "Doutor",
    },
  });
  expect([200, 409]).toContain(registerRes.status());
  return owner;
}

export async function createProjectViaUi(page: Page) {
  const draft = buildProjectCandidate();
  await page.goto("/app/projects/new");
  await expect(page.getByRole("heading", { name: "Novo projeto" })).toBeVisible();
  await page.getByPlaceholder("Ex: Sistema de detecção de anomalias com IA").fill(draft.title);
  await page.getByPlaceholder("Descreva os objetivos, metodologia e resultados esperados...").fill(draft.description);
  await page.getByPlaceholder("Ex: Conhecimento em Python, estatística básica").fill(draft.requirements);
  await page.getByPlaceholder("Ex: React, Spring Boot, PostgreSQL").fill(draft.technologies);
  await page.locator("#areaId").waitFor({ state: "visible" });
  await expect(page.locator("#areaId")).toBeEnabled({ timeout: 15000 });
  await page.locator("#areaId").selectOption({ index: 1 });
  const advisorSelect = page.locator("#orientadorId");
  if (await advisorSelect.isVisible()) {
    await advisorSelect.selectOption({ index: 1 });
  }
  await page.getByPlaceholder("Ex: 3").fill(String(draft.slots));
  await page.getByRole("button", { name: "Criar projeto" }).click();
  await expect(page).toHaveURL(/\/app\/projects\/\d+$/);
  const projectId = Number(page.url().match(/\/projects\/(\d+)$/)?.[1] ?? 0);
  expect(projectId).toBeGreaterThan(0);
  return { projectId, title: draft.title };
}

export async function loginAndGotoEdit(page: Page, user: { email: string; senha: string }, projectId: number) {
  const loginPage = new LoginPage(page);
  await loginPage.login(user.email, user.senha);
  await page.goto(`/app/projects/${projectId}/edit`);
  await expect(page.getByRole("heading", { name: "Editar projeto" })).toBeVisible();
}

export async function changeTitleAndSave(page: Page, newTitle: string) {
  await page.locator("#titulo").fill(newTitle);
  await page.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(page.getByText("Projeto atualizado! Redirecionando...")).toBeVisible();
}

export async function assertTitlePersisted(page: Page, projectId: number, newTitle: string) {
  await page.goto(`/app/projects/${projectId}`);
  await expect(page.getByRole("heading", { name: newTitle })).toBeVisible();
}

export async function assertEmptyTitleValidation(page: Page) {
  await page.locator("#titulo").fill("");
  await page.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(page.locator(".formulario-projeto__alerta--erro")).toBeVisible();
}

export async function assertEditBlockedForNonOwner(page: Page, projectId: number) {
  await page.goto(`/app/projects/${projectId}/edit`);
  await expect(page.getByRole("heading", { name: /editar projeto/i })).not.toBeVisible();
}

export async function cleanupProject(request: APIRequestContext, token: string, projectId: number) {
  const res = await request.delete(`${API_URL}/api/projetos/${projectId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect([200, 204]).toContain(res.status());
}
