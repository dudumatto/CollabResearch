import { expect, type APIRequestContext, type Page } from "@playwright/test";
import { buildTestUser, unique } from "../../helpers/test-data.helper";
import { LoginPage } from "../../pages/LoginPage";

const API_URL = process.env.VITE_API_URL ?? "http://127.0.0.1:8080";

async function registerUser(request: APIRequestContext, user: ReturnType<typeof buildTestUser>, tipo: "ALUNO" | "ORIENTADOR", extra: Record<string, unknown> = {}) {
  const response = await request.post(`${API_URL}/api/auth/register`, {
    data: {
      nome: user.nome,
      email: user.email,
      senha: user.senha,
      ra: user.ra,
      tipo,
      ...extra,
    },
  });

  expect([200, 409]).toContain(response.status());
  const payload = await response.json();
  return payload.usuario;
}

export async function prepareProgressScenario(request: APIRequestContext) {
  const orientadorUser = buildTestUser("progress-orientador", "Orientador E2E");
  const alunoUser = buildTestUser("progress-aluno", "Aluno E2E");

  await registerUser(request, orientadorUser, "ORIENTADOR", {
    departamento: "Computacao",
    titulacao: "Doutor",
  });
  const alunoProfile = await registerUser(request, alunoUser, "ALUNO", {});

  const orientadorLogin = await request.post(`${API_URL}/api/auth/login`, {
    data: { email: orientadorUser.email, senha: orientadorUser.senha },
  });
  expect(orientadorLogin.ok()).toBeTruthy();
  const orientadorAuth = await orientadorLogin.json();

  const areasRes = await request.get(`${API_URL}/api/areas`, {
    headers: { Authorization: `Bearer ${orientadorAuth.token}` },
  });
  const areas = await areasRes.json();
  const areaId = areas[0]?.id;

  const draft = {
    title: `Projeto ${unique("progress")}`,
    description: "Projeto criado pelo orientador para validar o fluxo de progresso.",
    requirements: "React, Spring",
    technologies: "React, Spring Boot",
    slots: 2,
  };

  const createdProject = await request.post(`${API_URL}/api/projetos`, {
    headers: { Authorization: `Bearer ${orientadorAuth.token}` },
    data: {
      titulo: draft.title,
      descricao: draft.description,
      requisitos: draft.requirements,
      tecnologias: draft.technologies,
      areaId,
      vagas: draft.slots,
    },
  });
  expect(createdProject.ok()).toBeTruthy();
  const project = await createdProject.json();

  const recruit = await request.post(`${API_URL}/api/projetos/${project.id}/recrutar`, {
    headers: { Authorization: `Bearer ${orientadorAuth.token}` },
    data: { usuarioId: alunoProfile.id },
  });
  expect(recruit.ok()).toBeTruthy();

  return {
    projectId: Number(project.id),
    projectTitle: project.titulo,
    orientador: orientadorUser,
    aluno: alunoUser,
  };
}

export async function loginAndOpenProgress(page: Page, user: { email: string; senha: string }) {
  const loginPage = new LoginPage(page);
  await loginPage.login(user.email, user.senha);
  await page.goto("/app/progress");
  await expect(page.getByText(/minhas etapas|progresso|acompanhamento estruturado/i).first()).toBeVisible();
}

export async function publishUpdate(page: Page, payload: { title: string; category: string; description?: string; stepName?: string; withoutDate?: boolean }) {
  if (!(await page.getByLabel("Título").isVisible().catch(() => false))) {
    await page.getByRole("button", { name: /nova atualização/i }).click();
  }
  await page.getByLabel("Título").fill(payload.title);
  await page.getByLabel("Categoria").selectOption(payload.category);

  if (payload.withoutDate) {
    await page.getByLabel("Registrar atualização sem data").check();
  }

  if (payload.stepName) {
    await page.getByLabel("Marco relacionado").selectOption({ label: payload.stepName });
  }

  if (payload.description) {
    await page.getByLabel("Descrição").fill(payload.description);
  }

  await page.getByRole("button", { name: /publicar/i }).click();
  await expect(page.getByText(/formulário está recolhido/i)).toBeVisible();
}

// Fluxo de marcos com checklist pela API (a UI e coberta pelos testes mockados):
// orientador cria a tarefa, aluno conclui e envia para revisao, orientador aprova.
async function loginToken(request: APIRequestContext, user: { email: string; senha: string }) {
  const login = await request.post(`${API_URL}/api/auth/login`, { data: { email: user.email, senha: user.senha } });
  expect(login.ok()).toBeTruthy();
  return (await login.json()).token as string;
}

export async function approveFirstMarcoViaReview(
  request: APIRequestContext,
  ctx: { projectId: number; orientador: { email: string; senha: string }; aluno: { email: string; senha: string } },
) {
  const orientadorToken = await loginToken(request, ctx.orientador);
  const alunoToken = await loginToken(request, ctx.aluno);
  const base = `${API_URL}/api/projetos/${ctx.projectId}/etapas`;
  const authOrientador = { Authorization: `Bearer ${orientadorToken}` };
  const authAluno = { Authorization: `Bearer ${alunoToken}` };

  const marcos = await (await request.get(base, { headers: authOrientador })).json();
  const marcoId = marcos[0].id as number;

  const comTarefa = await request.post(`${base}/${marcoId}/tarefas`, {
    headers: authOrientador,
    data: { titulo: "Entregar revisao bibliografica", obrigatoria: true },
  });
  expect(comTarefa.status()).toBe(201);
  const tarefa = (await comTarefa.json()).tarefas[0];
  expect(tarefa.origem).toBe("ORIENTADOR");

  // aluno nao envia sem concluir as obrigatorias, e nao aprova por conta propria
  expect((await request.post(`${base}/${marcoId}/enviar-revisao`, { headers: authAluno })).status()).toBe(409);
  const marcada = await request.patch(`${base}/${marcoId}/tarefas/${tarefa.id}`, { headers: authAluno, data: { concluida: true } });
  expect(marcada.ok()).toBeTruthy();
  const aposMarcar = await marcada.json();
  expect(aposMarcar.percentual).toBe(100);
  expect(aposMarcar.status).not.toBe("DONE");
  expect((await request.post(`${base}/${marcoId}/revisao`, { headers: authAluno, data: { acao: "APROVAR" } })).status()).toBe(403);

  expect((await request.post(`${base}/${marcoId}/enviar-revisao`, { headers: authAluno })).ok()).toBeTruthy();
  const aprovado = await request.post(`${base}/${marcoId}/revisao`, {
    headers: authOrientador,
    data: { acao: "APROVAR", comentario: "Aprovado" },
  });
  expect(aprovado.ok()).toBeTruthy();
  expect((await aprovado.json()).status).toBe("DONE");
  return marcos[0].titulo as string;
}

export async function assertProgressApi(request: APIRequestContext, token: string, projectId: number, title: string) {
  const res = await request.get(`${API_URL}/api/projects/${projectId}/progress`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(res.ok()).toBeTruthy();
  const payload = await res.json();
  const found = Array.isArray(payload?.updates)
    ? payload.updates.some((item) => String(item?.title ?? "").includes(title))
    : false;
  expect(found).toBeTruthy();
  return payload.updates.find((item) => String(item?.title ?? "").includes(title));
}

export async function reloadProgressAndAssert(page: Page, text: string) {
  await page.reload();
  await expect(page.getByText(text).first()).toBeVisible();
}
