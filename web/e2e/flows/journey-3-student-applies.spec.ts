import { test, expect } from "@playwright/test";
import { setupAluno, setupOrientador, loginViaUI, verifyTestProfile, loginViaApi, setupAdmin } from "../helpers/journey.helper";
import { cleanupTestData } from "../helpers/database-cleanup.helper";
import { ProjectDetailPage } from "../pages/ProjectDetailPage";
import { ApplicationsPage } from "../pages/ApplicationsPage";

const API_URL = process.env.E2E_API_URL ?? process.env.VITE_API_URL ?? "http://127.0.0.1:8080";

test.describe("jornada 3 — aluno se inscreve", () => {
  let adminToken = "";
  let orientadorToken = "";
  let projectId = 0;
  let projectTitle = "";

  test.beforeAll(async ({ request }) => {
    await verifyTestProfile(request);
    const orientador = await setupOrientador(request);
    orientadorToken = await loginViaApi(request, orientador);

    const areasRes = await request.get(`${API_URL}/api/areas`, {
      headers: { Authorization: `Bearer ${orientadorToken}` },
    });
    const areas = await areasRes.json();
    const areaId = areas[0]?.id;

    projectTitle = `Projeto Inscricao ${Date.now()}`;
    const createRes = await request.post(`${API_URL}/api/projetos`, {
      headers: { Authorization: `Bearer ${orientadorToken}` },
      data: {
        titulo: projectTitle,
        descricao: "Projeto para testar inscricao",
        requisitos: "Java",
        vagas: 5,
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

  test("aluno se inscreve em projeto e ve em minhas inscricoes", async ({ page, request }) => {
    const aluno = await setupAluno(request);
    await loginViaUI(page, aluno);

    const detailPage = new ProjectDetailPage(page);
    await detailPage.goto(projectId);
    await detailPage.expectProjectVisible(projectTitle);
    await detailPage.apply("Quero participar deste projeto de pesquisa!");

    const applicationsPage = new ApplicationsPage(page);
    await applicationsPage.goto();
    await applicationsPage.expectVisible();
    await expect(page.getByText(projectTitle)).toBeVisible();
  });
});