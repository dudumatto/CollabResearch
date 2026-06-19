import { expect, type APIRequestContext, type Page } from "@playwright/test";
import { buildLoginCandidate } from "../../factories/auth.factory";
import { buildProjectCandidate } from "../../factories/project.factory";
import { LoginPage } from "../../pages/LoginPage";
import { unique } from "../../helpers/test-data.helper";

const API_URL = process.env.VITE_API_URL ?? "http://127.0.0.1:8080";

async function waitForFeedbackLoaded(page: Page) {
  await expect(page.locator(".skeleton").first()).toBeHidden();
  await expect(page.getByRole("heading", { name: /Avaliar projeto/i })).toBeVisible();
}

export async function prepareFeedbackContext(request: APIRequestContext) {
  const user = buildLoginCandidate();
  await request.post(`${API_URL}/api/auth/register`, { data: { nome: user.nome, email: user.email, senha: user.senha, ra: user.ra } });
  const login = await request.post(`${API_URL}/api/auth/login`, { data: { email: user.email, senha: user.senha } });
  expect(login.ok()).toBeTruthy();
  const auth = await login.json();
  const token = auth.token as string;
  const areas = await (await request.get(`${API_URL}/api/areas`, { headers: { Authorization: `Bearer ${token}` } })).json();
  const cursos = await (await request.get(`${API_URL}/api/cursos`, { headers: { Authorization: `Bearer ${token}` } })).json();
  const p = buildProjectCandidate();
  const created = await request.post(`${API_URL}/api/projetos`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { titulo: p.title, descricao: p.description, requisitos: p.requirements, areaId: areas[0]?.id, curso: cursos[0]?.nome, vagas: p.slots },
  });
  expect(created.ok()).toBeTruthy();
  const project = await created.json();
  return { user, token, projectId: Number(project.id) };
}

export async function openFeedback(page: Page, user: { email: string; senha: string }) {
  const loginPage = new LoginPage(page);
  await loginPage.login(user.email, user.senha);
  await page.goto("/app/feedback");
  await waitForFeedbackLoaded(page);
}

export async function submitFeedback(page: Page) {
  const comment = `feedback-${unique("fb")}`;
  await waitForFeedbackLoaded(page);
  await page.getByRole("button", { name: "Avaliar" }).click();
  const projectSelect = page.locator("select.formulario-avaliacao__select");
  await expect(projectSelect).toBeVisible();
  const optionCount = await projectSelect.locator("option").count();
  if (optionCount < 2) return null;
  await projectSelect.selectOption({ index: 1 });
  await page.locator(".avaliacao-estrelas__botao").nth(3).click();
  await page.locator("textarea").fill(comment);
  await page.getByRole("button", { name: /enviar avaliacao/i }).click();
  return comment;
}

export async function assertFeedbackApi(request: APIRequestContext, token: string, userId: number) {
  const res = await request.get(`${API_URL}/api/feedback/usuario/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(res.ok()).toBeTruthy();
}
