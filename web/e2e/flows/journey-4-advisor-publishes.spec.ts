import { test, expect } from "@playwright/test";
import { setupOrientador, loginViaUI, verifyTestProfile, setupAdmin, loginViaApi } from "../helpers/journey.helper";
import { cleanupTestData } from "../helpers/database-cleanup.helper";
import { CreateProjectPage } from "../pages/CreateProjectPage";
import { ProjectsPage } from "../pages/ProjectsPage";
import { ProjectDetailPage } from "../pages/ProjectDetailPage";
import { buildProjectDraft } from "../helpers/test-data.helper";

const API_URL = process.env.E2E_API_URL ?? process.env.VITE_API_URL ?? "http://127.0.0.1:8080";

test.describe("jornada 4 — orientador publica projeto", () => {
  let adminToken = "";

  test.beforeAll(async ({ request }) => {
    await verifyTestProfile(request);
    const admin = await setupAdmin(request);
    const res = await request.post(`${API_URL}/api/auth/login`, {
      data: { email: admin.email, senha: admin.senha },
    });
    if (res.ok()) {
      const body = await res.json();
      adminToken = body.token;
    }
  });

  test.afterEach(async ({ request }) => {
    if (adminToken) await cleanupTestData(request, adminToken);
  });

  test("orientador cria projeto e aparece na listagem", async ({ page, request }) => {
    const orientador = await setupOrientador(request);
    await loginViaUI(page, orientador);

    const draft = buildProjectDraft("journey-pub");
    const createPage = new CreateProjectPage(page);
    const projectId = await createPage.createProject(draft);
    expect(projectId).toBeGreaterThan(0);

    const detailPage = new ProjectDetailPage(page);
    await detailPage.expectProjectVisible(draft.title);

    const projectsPage = new ProjectsPage(page);
    await projectsPage.goto();
    await projectsPage.searchProject(draft.title);
    await projectsPage.expectProjectVisible(draft.title);
  });
});