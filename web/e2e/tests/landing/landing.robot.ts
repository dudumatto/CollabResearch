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

export async function assertUpdatedLandingContent(page: Page) {
  await expect(page.getByText("collab-research.vercel.app", { exact: true })).toBeVisible();
  await expect(page.getByText("Gestão centralizada", { exact: true })).toBeVisible();
  await expect(page.getByText("Fluxo simplificado", { exact: true })).toBeVisible();
  await expect(page.getByText("Segurança e controle", { exact: true })).toBeVisible();
  await expect(page.getByText("Projetos disponíveis", { exact: true })).toBeVisible();
  await expect(page.getByText("Estudantes conectados", { exact: true })).toBeVisible();
  await expect(page.getByText("Orientadores ativos", { exact: true })).toBeVisible();
  await expect(page.getByText("Pesquisas em andamento", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Encontrar e gerenciar projetos de pesquisa não deveria ser complicado" })).toBeVisible();
  await expect(page.getByText("Informações espalhadas geram atrasos e retrabalho.", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Poucas oportunidades visíveis" })).toBeVisible();
  await expect(page.getByText("Estudantes têm dificuldade para encontrar projetos e se candidatar.", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Gestão manual" })).toBeVisible();
  await expect(page.getByText("Inscrições, documentos e prazos ainda exigem controle manual.", { exact: true })).toBeVisible();
  await expect(page.getByText("Pesquise projetos por área de pesquisa, curso ou orientador e encontre a oportunidade certa para você.", { exact: true })).toBeVisible();
  await expect(page.getByText("© 2026 CollabResearch. Plataforma de Gerenciamento de Iniciação Científica.", { exact: true })).toBeVisible();
  await expect(page.getByText("Hoje, o processo envolve e-mails dispersos, planilhas desatualizadas e comunicações confusas.", { exact: true })).toHaveCount(0);
}
