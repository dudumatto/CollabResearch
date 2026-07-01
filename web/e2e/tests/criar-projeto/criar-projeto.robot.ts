import { expect, type APIRequestContext, type Page } from "@playwright/test";
import { buildLoginCandidate } from "../../factories/auth.factory";
import { buildProjectCandidate } from "../../factories/project.factory";
import { LoginPage } from "../../pages/LoginPage";

const API_URL = process.env.VITE_API_URL ?? "http://127.0.0.1:8080";

export async function prepareOrientadorUser(request: APIRequestContext) {
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

export async function loginAsOrientador(page: Page, user: { email: string; senha: string }) {
  const loginPage = new LoginPage(page);
  await loginPage.login(user.email, user.senha);
}

export async function fillAndSubmitProject(page: Page) {
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
  return draft;
}

export async function assertEmptyFormValidation(page: Page) {
  await page.goto("/app/projects/new");
  await expect(page.getByRole("heading", { name: "Novo projeto" })).toBeVisible();
  await page.locator("#areaId").waitFor({ state: "visible" });
  await expect(page.locator("#areaId")).toBeEnabled({ timeout: 15000 });
  await page.getByRole("button", { name: "Criar projeto" }).click();
  await expect(page.locator(".formulario-projeto__alerta--erro")).toBeVisible();
}

export async function assertProjectInListings(page: Page, title: string) {
  await page.goto("/app/projects");
  await page.getByPlaceholder("Buscar projetos por título, área ou tecnologia...").fill(title);
  await expect(page.getByText(title).first()).toBeVisible();
}

export async function assertCancelGoesBack(page: Page) {
  await page.goto("/app/projects/new");
  await expect(page.getByRole("heading", { name: "Novo projeto" })).toBeVisible();
  await page.getByRole("button", { name: "Cancelar" }).click();
  await expect(page).toHaveURL(/\/app\/projects$/);
}

export async function cleanupProject(request: APIRequestContext, token: string, projectId: number) {
  const res = await request.delete(`${API_URL}/api/projetos/${projectId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect([200, 204]).toContain(res.status());
}
