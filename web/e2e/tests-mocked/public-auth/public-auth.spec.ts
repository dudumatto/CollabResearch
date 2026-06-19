import { test, expect } from "@playwright/test";
import { setupApiMock } from "../../helpers/api-mock.helper";
import {
  runLandingNavigationFlow,
  runLoginFlow,
  runRegisterFlow,
} from "./public-auth.robot";

test.describe("publico e autenticacao", () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMock(page);
  });

  test("landing page navega para login, cadastro e protege rotas privadas", async ({ page }) => {
    await runLandingNavigationFlow(page);
  });

  test("login exibe erro com credenciais invalidas e entra com credenciais validas", async ({ page }) => {
    await runLoginFlow(page);
  });

  test("cadastro valida senhas divergentes e cria conta", async ({ page }) => {
    await runRegisterFlow(page);
  });
});
