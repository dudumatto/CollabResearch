import { test } from "@playwright/test";
import { assertApiCoverage, assertFrontendRoutes, loginUi, prepareCoverageContext } from "./cobertura.robot";

test.describe("cobertura sistemica real", () => {
  test("cobre rotas principais de frontend e endpoints principais de backend", async ({ page, request }) => {
    const ctx = await prepareCoverageContext(request);
    await loginUi(page, ctx.user);
    await assertFrontendRoutes(page, ctx.projectId);
    await assertApiCoverage(request, ctx.token, ctx.projectId);
  });
});
