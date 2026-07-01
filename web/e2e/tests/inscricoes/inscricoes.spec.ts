import { test } from "@playwright/test";
import {
  applyToProjectViaApi,
  cancelApplicationViaUi,
  loginAndOpenApplications,
  prepareOwnerLearnerAndProject,
  validateApplicationVisibleInUi,
  validateCanceledInApi,
} from "./inscricoes.robot";
import { cleanupTestData } from "../../helpers/database-cleanup.helper";
import { verifyTestProfile, setupAdmin } from "../../helpers/journey.helper";

const API_URL = process.env.E2E_API_URL ?? process.env.VITE_API_URL ?? "http://127.0.0.1:8080";

test.describe("inscricoes real", () => {
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

  test("aluno se inscreve, visualiza no frontend, cancela na UI e valida reflexo na API real", async ({ page, request }) => {
    const { learner, projectId, projectTitle } = await prepareOwnerLearnerAndProject(request);
    await applyToProjectViaApi(request, learner, projectId);
    await loginAndOpenApplications(page, learner);
    await validateApplicationVisibleInUi(page, projectTitle);
    await cancelApplicationViaUi(page, projectTitle);
    await validateCanceledInApi(request, learner, projectId);
  });
});