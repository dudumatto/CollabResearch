import { test, expect } from "@playwright/test";
import { buildTestUser } from "../helpers/test-data.helper";
import { cleanupTestData } from "../helpers/database-cleanup.helper";
import {
  verifyTestProfile,
  setupAdmin,
} from "../helpers/journey.helper";
import { LandingPage } from "../pages/LandingPage";
import { RegisterPage } from "../pages/RegisterPage";
import { LoginPage } from "../pages/LoginPage";

test.describe("jornada 1 — visitante vira usuario", () => {
  let adminToken = "";

  test.beforeAll(async ({ request }) => {
    await verifyTestProfile(request);
    const admin = await setupAdmin(request);
    const loginRes = await request.post(
      `${process.env.E2E_API_URL ?? process.env.VITE_API_URL ?? "http://127.0.0.1:8080"}/api/auth/login`,
      { data: { email: admin.email, senha: admin.senha } }
    );
    if (loginRes.ok()) {
      const body = await loginRes.json();
      adminToken = body.token;
    }
  });

  test.afterEach(async ({ request }) => {
    if (adminToken) {
      await cleanupTestData(request, adminToken);
    }
  });

  test("visitante navega da landing ate criar conta e logar", async ({
    page,
  }) => {
    const landing = new LandingPage(page);
    await landing.goto();
    await expect(
      page.getByText("Sua pesquisa começa aqui.")
    ).toBeVisible();

    await page.getByRole("button", { name: /criar conta/i }).first().click();
    await expect(page).toHaveURL(/\/register/);

    const user = buildTestUser("journey-v1", "Aluno Jornada 1");
    const registerPage = new RegisterPage(page);
    await registerPage.chooseDefaultStudentType();
    await registerPage.fillPersonalData(user);
    await registerPage.continueToAcademicData();
    await registerPage.fillAcademicData();
    await registerPage.acceptTerms();
    await registerPage.submit();

    await expect(page).toHaveURL(/\/app$/);
    await expect(
      page.getByRole("heading", { name: "Dashboard", exact: true })
    ).toBeVisible();
    const token = await page.evaluate(() =>
      localStorage.getItem("tcc_auth_token")
    );
    expect(token).toBeTruthy();

    await page.getByRole("button", { name: /sair|logout/i }).click();
    await expect(page).toHaveURL(/\/login$/);

    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.fillForm("invalido@test.com", "senhaerrada");
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page.getByText(/credenciais|invalid|erro/i)).toBeVisible();

    await loginPage.fillForm(user.email, user.senha);
    await loginPage.submit();
    await expect(page).toHaveURL(/\/app$/);
    await expect(
      page.getByRole("heading", { name: "Dashboard", exact: true })
    ).toBeVisible();
  });
});