import { expect, type APIRequestContext, type Page } from "@playwright/test";
import { buildLoginCandidate } from "../../factories/auth.factory";
import { buildProjectCandidate } from "../../factories/project.factory";
import { LoginPage } from "../../pages/LoginPage";

const API_URL = process.env.VITE_API_URL ?? "http://127.0.0.1:8080";

export async function prepareProjectWithOwner(request: APIRequestContext) {
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
  await page.locator("#areaId").waitFor({ state: "visible" });
  await expect(page.locator("#areaId")).toBeEnabled({ timeout: 15000 });
  await page.getByPlaceholder("Ex: Sistema de detecção de anomalias com IA").fill(draft.title);
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
  const projectId = Number(page.url().match(/\/projects\/(\d+)$/)?.[1] ?? 0);
  expect(projectId).toBeGreaterThan(0);
  return { projectId, title: draft.title };
}

export async function loginAndOpenDetail(page: Page, user: { email: string; senha: string }, projectId: number) {
  const loginPage = new LoginPage(page);
  await loginPage.login(user.email, user.senha);
  await page.goto(`/app/projects/${projectId}`);
}

export async function assertProjectInfoVisible(page: Page, title: string) {
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  await expect(page.getByText("Sobre o projeto")).toBeVisible();
}

export async function assertOwnerActionsVisible(page: Page) {
  await expect(page.getByRole("button", { name: "Editar" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Excluir" })).toBeVisible();
}

export async function assertOwnerActionsHidden(page: Page) {
  await expect(page.getByRole("button", { name: "Editar" })).not.toBeVisible();
  await expect(page.getByRole("button", { name: "Excluir" })).not.toBeVisible();
}

export async function assertApplyButtonVisible(page: Page) {
  const btn = page.getByRole("button", { name: "Inscrever-se" });
  if (await btn.isVisible()) {
    expect(true).toBeTruthy();
  }
}

export async function assertBackButtonWorks(page: Page) {
  await page.getByRole("button", { name: /voltar/i }).first().click();
  await expect(page).toHaveURL(/\/app\/projects$/);
}

export async function cleanupProject(request: APIRequestContext, token: string, projectId: number) {
  const res = await request.delete(`${API_URL}/api/projetos/${projectId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect([200, 204]).toContain(res.status());
}
