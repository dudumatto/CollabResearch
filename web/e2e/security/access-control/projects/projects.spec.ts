import { test, expect } from "@playwright/test";
import {
  prepareProjectScenario,
  getProject,
  updateProject,
  deleteProject,
  listCollaborators,
} from "./projects.robot";
import { assertForbidden, assertOk, registerAndLoginOrientador } from "../../helpers/security.helper";
import { API_URL } from "../../../helpers/api.helper";
import { cleanupTestData } from "../../../helpers/database-cleanup.helper";
import { verifyTestProfile, setupAdmin } from "../../../helpers/journey.helper";

test.describe("access control projetos", () => {
  let scenario: Awaited<ReturnType<typeof prepareProjectScenario>>;
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
    scenario = await prepareProjectScenario(request);
  });

  test.afterEach(async ({ request }) => {
    if (adminToken) await cleanupTestData(request, adminToken);
  });

  test("dono visualiza projeto", async ({ request }) => {
    const response = await getProject(request, scenario.owner.token, scenario.projectId);
    await assertOk(response);
  });

  test("colaborador visualiza projeto", async ({ request }) => {
    const response = await getProject(request, scenario.collaborator.token, scenario.projectId);
    await assertOk(response);
  });

  test("usuário externo visualiza projeto (público)", async ({ request }) => {
    const response = await getProject(request, scenario.outsider.token, scenario.projectId);
    await assertOk(response);
  });

  test("dono edita projeto", async ({ request }) => {
    const response = await updateProject(request, scenario.owner.token, scenario.projectId);
    await assertOk(response);
  });

  test("colaborador não edita projeto", async ({ request }) => {
    const response = await updateProject(request, scenario.collaborator.token, scenario.projectId);
    await assertForbidden(response);
  });

  test("usuário externo não edita projeto", async ({ request }) => {
    const response = await updateProject(request, scenario.outsider.token, scenario.projectId);
    await assertForbidden(response);
  });

  test("dono lista colaboradores", async ({ request }) => {
    const response = await listCollaborators(request, scenario.owner.token, scenario.projectId);
    await assertOk(response);
    const collabs = await response.json();
    expect(Array.isArray(collabs)).toBeTruthy();
  });

  test("colaborador lista colaboradores", async ({ request }) => {
    const response = await listCollaborators(request, scenario.collaborator.token, scenario.projectId);
    await assertOk(response);
  });

  test("usuário externo lista colaboradores (público)", async ({ request }) => {
    const response = await listCollaborators(request, scenario.outsider.token, scenario.projectId);
    await assertOk(response);
  });

  test("dono exclui projeto", async ({ request }) => {
    const orientador = await registerAndLoginOrientador(request, "ac-del-orient");
    const areasRes = await request.get(`${API_URL}/api/areas`, {
      headers: { Authorization: `Bearer ${scenario.owner.token}` },
    });
    const areas = await areasRes.json();
    const createRes = await request.post(`${API_URL}/api/projetos`, {
      headers: { Authorization: `Bearer ${scenario.owner.token}` },
      data: { titulo: "Projeto Para Excluir", vagas: 1, areaId: areas[0]?.id, orientadorId: orientador.id },
    });
    const project = await createRes.json();
    const response = await deleteProject(request, scenario.owner.token, Number(project.id));
    expect([200, 204]).toContain(response.status());
  });

  test("usuário externo não exclui projeto", async ({ request }) => {
    const response = await deleteProject(request, scenario.outsider.token, scenario.projectId);
    await assertForbidden(response);
  });
});