import { test, expect } from "@playwright/test";
import { assertDashboardApiData, openDashboard, prepareDashboardUser } from "./dashboard.robot";

test.describe("dashboard real", () => {
  test("carrega dados reais do dashboard", async ({ page, request }) => {
    const user = await prepareDashboardUser(request);
    await openDashboard(page, user);
    const token = await page.evaluate(() => localStorage.getItem("tcc_auth_token"));
    expect(token).toBeTruthy();
    await assertDashboardApiData(request, token!);
  });
});
