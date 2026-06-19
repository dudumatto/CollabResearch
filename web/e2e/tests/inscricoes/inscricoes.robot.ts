import { expect, type APIRequestContext, type Page } from "@playwright/test";
import { buildLoginCandidate } from "../../factories/auth.factory";
import { buildProjectCandidate } from "../../factories/project.factory";
import { LoginPage } from "../../pages/LoginPage";
import { API_URL } from "../../helpers/api.helper";

type User = { nome: string; email: string; senha: string; ra: string };

export async function prepareOwnerLearnerAndProject(request: APIRequestContext) {
  const owner = buildLoginCandidate();
  const learner = buildLoginCandidate();

  await registerUser(request, owner);
  await registerUser(request, learner);

  const ownerToken = await loginByApi(request, owner);
  const createdProject = await createProjectByApi(request, ownerToken);

  return { owner, learner, ownerToken, projectId: createdProject.id, projectTitle: createdProject.title };
}

export async function loginAndOpenApplications(page: Page, learner: User) {
  const loginPage = new LoginPage(page);
  await loginPage.login(learner.email, learner.senha);
  await page.goto("/app/applications");
  await expect(page.getByRole("heading", { name: "Minhas Inscrições", exact: true })).toBeVisible();
}

export async function applyToProjectViaApi(request: APIRequestContext, learner: User, projectId: number) {
  const learnerToken = await loginByApi(request, learner);
  const response = await request.post(`${API_URL}/api/inscricoes`, {
    headers: { Authorization: `Bearer ${learnerToken}` },
    data: { projetoId: projectId, motivacao: "Inscrição real E2E" },
  });
  expect(response.ok(), await response.text()).toBeTruthy();
}

export async function validateApplicationVisibleInUi(page: Page, projectTitle: string) {
  await page.reload();
  await expect(page.getByText("Total de inscrições")).toBeVisible();
  await expect(page.getByText(projectTitle)).toBeVisible();
}

export async function cancelApplicationViaUi(page: Page, projectTitle: string) {
  await page.getByText(projectTitle).click();
  const cancelButton = page.getByRole("button", { name: /cancelar inscrição/i });
  await expect(cancelButton).toBeVisible();
  await cancelButton.click();
  await page.getByRole("button", { name: /confirmar cancelamento/i }).click();
}

export async function validateCanceledInApi(request: APIRequestContext, learner: User, projectId: number) {
  const learnerToken = await loginByApi(request, learner);
  const response = await request.get(`${API_URL}/api/usuarios/minhas-inscricoes`, {
    headers: { Authorization: `Bearer ${learnerToken}` },
  });
  expect(response.ok(), await response.text()).toBeTruthy();
  const body = (await response.json()) as Array<{ projetoId?: number; projeto?: { id?: number }; status?: string }>;
  const item = body.find((entry) => (entry.projetoId ?? entry.projeto?.id) === projectId);
  expect(item).toBeFalsy();
}

async function registerUser(request: APIRequestContext, user: User) {
  const response = await request.post(`${API_URL}/api/auth/register`, {
    data: { nome: user.nome, email: user.email, senha: user.senha, ra: user.ra },
  });
  expect([200, 409]).toContain(response.status());
}

async function loginByApi(request: APIRequestContext, user: User) {
  const response = await request.post(`${API_URL}/api/auth/login`, {
    data: { email: user.email, senha: user.senha },
  });
  expect(response.ok(), await response.text()).toBeTruthy();
  const body = (await response.json()) as { token: string };
  expect(body.token).toBeTruthy();
  return body.token;
}

async function createProjectByApi(request: APIRequestContext, ownerToken: string) {
  const areasRes = await request.get(`${API_URL}/api/areas`, {
    headers: { Authorization: `Bearer ${ownerToken}` },
  });
  expect(areasRes.ok(), await areasRes.text()).toBeTruthy();
  const cursosRes = await request.get(`${API_URL}/api/cursos`, {
    headers: { Authorization: `Bearer ${ownerToken}` },
  });
  expect(cursosRes.ok(), await cursosRes.text()).toBeTruthy();

  const areas = (await areasRes.json()) as Array<{ id: number }>;
  const cursos = (await cursosRes.json()) as Array<{ nome: string }>;
  const draft = buildProjectCandidate();
  const createRes = await request.post(`${API_URL}/api/projetos`, {
    headers: { Authorization: `Bearer ${ownerToken}` },
    data: {
      titulo: draft.title,
      descricao: draft.description,
      requisitos: draft.requirements,
      areaId: areas[0]?.id,
      curso: cursos[0]?.nome ?? "Ciencia da Computacao",
      vagas: draft.slots,
    },
  });
  expect(createRes.ok(), await createRes.text()).toBeTruthy();
  const created = (await createRes.json()) as { id: number; titulo?: string };
  expect(created.id).toBeGreaterThan(0);
  return { id: created.id, title: created.titulo ?? draft.title };
}
