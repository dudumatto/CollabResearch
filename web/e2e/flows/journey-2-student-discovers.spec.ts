import { test, expect } from "@playwright/test";
import { setupAluno, setupOrientador, loginViaUI, verifyTestProfile, loginViaApi, setupAdmin } from "../helpers/journey.helper";
import { cleanupTestData } from "../helpers/database-cleanup.helper";
import { ProjectsPage } from "../pages/ProjectsPage";
import { ProjectDetailPage } from "../pages/ProjectDetailPage";

const API_URL = process.env.E2E_API_URL ?? process.env.VITE_API_URL ?? "http://127.0.0.1:8080";

test.describe("jornada 2 — aluno encontra projeto", () => {
  let adminToken = "";
  let orientadorToken = "";
  let projectId = 0;
  let projectTitle = "";

  test.beforeAll(async ({ request }) => {
    await verifyTestProfile(request);
    const orientador = await setupOrientador(request);
    orientadorToken = await loginViaApi(request, orientador);
    const aluno = await setupAluno(request);

    const areasRes = await request.get(`${API_URL}/api/areas`, {
      headers: { Authorization: `Bearer ${orientadorToken}` },
    });
    const areas = await areasRes.json();
    const areaId = areas[0]?.id;

    projectTitle = `Projeto Descoberta ${Date.now()}`;
    const createRes = await request.post(`${API_URL}/api/projetos`, {
      headers: { Authorization: `Bearer ${orientadorToken}` },
      data: {
        titulo: projectTitle,
        descricao: "Projeto para testar descoberta por alunos",
        requisitos: "Python, curiosidade",
        vagas: 3,
        areaId,
      },
    });
    const project = await createRes.json();
    projectId = Number(project.id);

    const admin = await setupAdmin(request);
    const loginRes = await request.post(`${API_URL}/api/auth/login`, {
      data: { email: admin.email, senha: admin.senha },
    });
    if (loginRes.ok()) {
      const body = await loginRes.json();
      adminToken = body.token;
    }
  });

  test.afterEach(async ({ request }) => {
    if (adminToken) await cleanupTestData(request, adminToken);
  });

  test("aluno busca projeto por titulo e encontra", async ({ page, request }) => {
    const aluno = await setupAluno(request);
    await loginViaUI(page, aluno);

    const projectsPage = new ProjectsPage(page);
    await projectsPage.goto();
    await projectsPage.searchProject(projectTitle);
    await projectsPage.expectProjectVisible(projectTitle);
  });

  test("aluno abre detalhe do projeto e ve informacoes", async ({ page, request }) => {
    const aluno = await setupAluno(request);
    await loginViaUI(page, aluno);

    const detailPage = new ProjectDetailPage(page);
    await detailPage.goto(projectId);
    await detailPage.expectProjectVisible(projectTitle);
  });
});