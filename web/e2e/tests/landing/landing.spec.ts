import { test, expect } from "@playwright/test";
import {
  gotoLanding,
  assertLandingLoaded,
  assertLandingCTAsVisible,
  runLandingToLogin,
  runLandingToRegister,
  assertLandingSections,
} from "./landing.robot";

test.describe("landing page real", () => {
  test("pagina carrega com titulo e hero visiveis", async ({ page }) => {
    await gotoLanding(page);
    await assertLandingLoaded(page);
  });

  test("botoes CTA estao visiveis", async ({ page }) => {
    await gotoLanding(page);
    await assertLandingCTAsVisible(page);
  });

  test("botao entrar navega para login", async ({ page }) => {
    await gotoLanding(page);
    await runLandingToLogin(page);
  });

  test("botao criar conta navega para register", async ({ page }) => {
    await gotoLanding(page);
    await runLandingToRegister(page);
  });

  test("secoes principais da landing estao visiveis", async ({ page }) => {
    await gotoLanding(page);
    await assertLandingSections(page);
  });
});
