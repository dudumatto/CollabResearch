import { expect, type Page } from "@playwright/test";

export async function gotoLanding(page: Page) {
  await page.goto("/");
}

export async function assertLandingLoaded(page: Page) {
  await expect(page).toHaveTitle("CollabResearch — Plataforma de Iniciação Científica");
  await expect(page.locator(".landing__logo-nome").first()).toContainText("CollabResearch");
  await expect(page.locator(".landing__hero-titulo")).toBeVisible();
  await expect(page.locator(".landing__hero-subtitulo")).toBeVisible();
}

export async function assertLandingCTAsVisible(page: Page) {
  await expect(page.getByRole("button", { name: "Entrar" }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: /criar conta/i }).first()).toBeVisible();
}

export async function runLandingToLogin(page: Page) {
  await page.getByRole("button", { name: "Entrar" }).first().click();
  await expect(page).toHaveURL(/\/login$/);
}

export async function runLandingToRegister(page: Page) {
  await page.getByRole("button", { name: /criar conta/i }).first().click();
  await expect(page).toHaveURL(/\/register$/);
}

export async function assertLandingSections(page: Page) {
  await expect(page.locator("#problema")).toBeVisible();
  await expect(page.locator("#solucao")).toBeVisible();
  await expect(page.locator("#funcionalidades")).toBeVisible();
  await expect(page.locator("#como-funciona")).toBeVisible();
}
