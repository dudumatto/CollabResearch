import { expect, type Page } from "@playwright/test";
import { buildTestUser } from "../../helpers/test-data.helper";

export async function runLandingNavigationFlow(page: Page) {
  await page.goto("/");
  await expect(page).toHaveTitle(/CollabResearch/);
  await expect(page.getByText("Sua pesquisa comeca")).toBeVisible();
  await expect(page.getByText("Busca Inteligente de Projetos")).toBeVisible();
  await page.getByRole("button", { name: "Entrar" }).first().click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/");
  await page.getByRole("button", { name: /Criar conta/ }).first().click();
  await expect(page).toHaveURL(/\/register$/);
  await page.goto("/app");
  await expect(page).toHaveURL(/\/login$/);
}

export async function runLoginFlow(page: Page) {
  await page.goto("/login");
  await page.getByPlaceholder("seu@universidade.br").fill("erro@universidade.br");
  await page.getByPlaceholder("Digite sua senha").fill("senha-incorreta");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByText("Credenciais invalidas.")).toBeVisible();
  await page.getByPlaceholder("seu@universidade.br").fill("aluno@universidade.br");
  await page.getByPlaceholder("Digite sua senha").fill("SenhaE2E123!");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByRole("heading", { name: "Dashboard", exact: true })).toBeVisible();
  await expect(page.evaluate(() => localStorage.getItem("tcc_auth_token"))).resolves.toBeTruthy();
}

export async function runRegisterFlow(page: Page) {
  const user = buildTestUser("register-flow", "Usuario Cadastro E2E");
  await page.goto("/register");
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByPlaceholder("Seu nome completo").fill(user.nome);
  await page.getByPlaceholder("seu@universidade.br").fill(user.email);
  await page.getByPlaceholder("Seu registro acadêmico").fill(user.ra);
  await page.getByPlaceholder("Minimo 8 caracteres").fill(user.senha);
  await page.getByPlaceholder("Repita a senha").fill("SenhaDiferente123!");
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page.getByText("As senhas não coincidem.")).toBeVisible();
  await page.getByPlaceholder("Repita a senha").fill(user.senha);
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.locator("select").first().selectOption({ index: 1 });
  await page.locator("select").nth(1).selectOption({ index: 1 });
  await page.locator("select").nth(2).selectOption({ index: 1 });
  await page.locator("#terms").check();
  await page.getByRole("button", { name: "Criar conta" }).click();
  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByRole("heading", { name: "Dashboard", exact: true })).toBeVisible();
}
