import { expect, type APIRequestContext, type Page } from "@playwright/test";
import { buildLoginCandidate } from "../../factories/auth.factory";
import { buildProjectCandidate } from "../../factories/project.factory";
import { LoginPage } from "../../pages/LoginPage";

const API_URL = process.env.VITE_API_URL ?? "http://127.0.0.1:8080";

export async function prepareCoverageContext(request: APIRequestContext) {
  const user = buildLoginCandidate();
  const register = await request.post(`${API_URL}/api/auth/register`, {
    data: { nome: user.nome, email: user.email, senha: user.senha, ra: user.ra },
  });
  expect([200, 409]).toContain(register.status());

  const login = await request.post(`${API_URL}/api/auth/login`, {
    data: { email: user.email, senha: user.senha },
  });
  expect(login.ok()).toBeTruthy();
  const auth = await login.json();
  const token = auth.token as string;

  const areas = await (await request.get(`${API_URL}/api/areas`, { headers: { Authorization: `Bearer ${token}` } })).json();
  const cursos = await (await request.get(`${API_URL}/api/cursos`, { headers: { Authorization: `Bearer ${token}` } })).json();
  const draft = buildProjectCandidate();
  const projectRes = await request.post(`${API_URL}/api/projetos`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      titulo: draft.title,
      descricao: draft.description,
      requisitos: draft.requirements,
      areaId: areas[0]?.id,
      curso: cursos[0]?.nome,
      vagas: draft.slots,
    },
  });
  expect(projectRes.ok()).toBeTruthy();
  const project = await projectRes.json();
  return { user, token, projectId: Number(project.id) };
}

export async function loginUi(page: Page, user: { email: string; senha: string }) {
  const loginPage = new LoginPage(page);
  await loginPage.login(user.email, user.senha);
}

export async function assertFrontendRoutes(page: Page, projectId: number) {
  const routes = [
    "/app",
    "/app/projects",
    "/app/projects/new",
    `/app/projects/${projectId}`,
    `/app/projects/${projectId}/edit`,
    `/app/projects/${projectId}/applications`,
    "/app/applications",
    "/app/chat",
    "/app/progress",
    "/app/feedback",
    "/app/profile",
    "/app/documents",
    "/app/notifications",
    "/app/configuracoes",
  ];

  for (const route of routes) {
    await page.goto(route);
    await expect(page).toHaveURL(new RegExp(route.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
}

type EndpointProbe = { method: "GET" | "POST" | "PUT" | "DELETE"; path: string; expected: number[]; body?: unknown };

export async function assertApiCoverage(request: APIRequestContext, token: string, projectId: number) {
  const probes: EndpointProbe[] = [
    { method: "GET", path: "/api/areas", expected: [200] },
    { method: "GET", path: "/api/cursos", expected: [200] },
    { method: "GET", path: "/api/dashboard", expected: [200] },
    { method: "GET", path: "/api/projetos", expected: [200] },
    { method: "GET", path: `/api/projetos/${projectId}`, expected: [200] },
    { method: "GET", path: `/api/projetos/${projectId}/colaboradores`, expected: [200] },
    { method: "GET", path: `/api/projetos/${projectId}/progresso`, expected: [200] },
    { method: "GET", path: "/api/notificacoes", expected: [200] },
    { method: "PUT", path: "/api/notificacoes/ler-todas", expected: [200, 204] },
    { method: "GET", path: "/api/usuarios/me", expected: [200] },
    { method: "GET", path: "/api/usuarios/minhas-inscricoes", expected: [200] },
    { method: "GET", path: "/api/conversas/1/todas", expected: [200, 403] },
    { method: "GET", path: `/api/feedback/usuario/1`, expected: [200, 403] },
    { method: "POST", path: `/api/projetos/${projectId}/progresso`, expected: [200, 201], body: { descricao: "Cobertura E2E" } },
    { method: "POST", path: "/api/auth/logout", expected: [200] },
  ];

  for (const probe of probes) {
    const headers = { Authorization: `Bearer ${token}` };
    const response =
      probe.method === "GET"
        ? await request.get(`${API_URL}${probe.path}`, { headers })
        : probe.method === "POST"
          ? await request.post(`${API_URL}${probe.path}`, { headers, data: probe.body })
          : probe.method === "PUT"
            ? await request.put(`${API_URL}${probe.path}`, { headers, data: probe.body })
            : await request.delete(`${API_URL}${probe.path}`, { headers });

    expect(probe.expected, `${probe.method} ${probe.path} status ${response.status()}`).toContain(response.status());
  }
}
