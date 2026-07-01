import { test } from "@playwright/test";
import { assertApiCoverage, assertFrontendRoutes, loginUi, prepareCoverageContext } from "./cobertura.robot";
import { cleanupTestData } from "../../helpers/database-cleanup.helper";
import { verifyTestProfile, setupAdmin } from "../../helpers/journey.helper";

const API_URL = process.env.E2E_API_URL ?? process.env.VITE_API_URL ?? "http://127.0.0.1:8080";

test.describe("cobertura sistemica real", () => {
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

  test("cobre rotas principais de frontend e endpoints principais de backend", async ({ page, request }) => {
    const ctx = await prepareCoverageContext(request);
    await loginUi(page, ctx.user);
    await assertFrontendRoutes(page, ctx.projectId);
    await assertApiCoverage(request, ctx.token, ctx.projectId);
  });
});