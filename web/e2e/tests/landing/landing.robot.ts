import { expect, type Page } from "@playwright/test";

export async function gotoLanding(page: Page) {
  await page.goto("/");
  await page.locator(".hero__title").waitFor();
}

export async function assertLandingLoaded(page: Page) {
  await expect(page).toHaveTitle("CollabResearch | Menos burocracia, mais pesquisa");
  await expect(page.getByRole("link", { name: "CollabResearch, início" })).toBeVisible();
  await expect(page.locator(".hero__title")).toBeVisible();
  await expect(page.locator(".hero__lede")).toBeVisible();
}

export async function assertLandingCTAsVisible(page: Page) {
  await expect(page.getByRole("link", { name: "Entrar" }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: /criar conta/i }).first()).toBeVisible();
}

export async function runLandingToLogin(page: Page) {
  await page.getByRole("link", { name: "Entrar" }).first().click();
  await expect(page).toHaveURL(/\/login$/);
}

export async function runLandingToRegister(page: Page) {
  await page.getByRole("link", { name: /criar conta/i }).first().click();
  await expect(page).toHaveURL(/\/register$/);
}

export async function assertLandingSections(page: Page) {
  for (const id of ["problema", "solucao", "lumen", "plataforma"]) {
    await expect(page.locator(`#${id}`)).toBeAttached();
  }
}

export async function assertUpdatedLandingContent(page: Page) {
  await expect(page.getByRole("heading", { name: "Um só lugar para o ciclo inteiro da pesquisa." })).toBeAttached();
  await expect(page.getByRole("heading", { name: "Cada lado ganha o que faltava." })).toBeAttached();
  await expect(page.getByRole("heading", { name: "Justa por design. Difícil de enganar." })).toBeAttached();
  await expect(page.getByText("Critérios transparentes", { exact: true })).toBeAttached();
  await expect(page.getByText("© 2026 CollabResearch.", { exact: true })).toBeAttached();
}
