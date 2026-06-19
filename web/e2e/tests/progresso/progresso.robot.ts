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
  await expect(page.getByText(/progresso do projeto|acompanhamento estruturado/i).first()).toBeVisible();
}

export async function publishUpdate(page: Page, payload: { title: string; category: string; description?: string; stepName?: string; contribution?: number }) {
  if (!(await page.getByLabel("Título").isVisible().catch(() => false))) {
    await page.getByRole("button", { name: /nova atualização/i }).click();
  }
  await page.getByLabel("Título").fill(payload.title);
  await page.getByLabel("Categoria").selectOption(payload.category);

  if (payload.stepName) {
    await page.getByLabel("Etapa relacionada").selectOption({ label: payload.stepName });
    if (typeof payload.contribution === "number") {
      await page.getByRole("slider").evaluate((element, value) => {
        const input = element as HTMLInputElement;
        input.value = String(value);
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
      }, payload.contribution);
    }
  }

  if (payload.description) {
    await page.getByLabel("Descrição").fill(payload.description);
  }

  await page.getByRole("button", { name: /publicar/i }).click();
  await expect(page.getByText(payload.title).first()).toBeVisible();
}

export async function advanceActiveStep(page: Page) {
  const button = page.getByRole("button", { name: /concluir etapa/i }).first();
  await expect(button).toBeVisible();
  await button.click();
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
}

export async function reloadProgressAndAssert(page: Page, text: string) {
  await page.reload();
  await expect(page.getByText(text).first()).toBeVisible();
}
