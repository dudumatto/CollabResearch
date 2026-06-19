import { expect, type Page } from "@playwright/test";
import { RegisterPage } from "../../pages/RegisterPage";
import { buildRegisterCandidate } from "../../factories/auth.factory";
import { findUserByEmail } from "../../helpers/db.helper";

export async function runCadastroFlow(page: Page) {
  const user = buildRegisterCandidate();
  const registerPage = new RegisterPage(page);
  await registerPage.registerStudent(user);
  return user;
}

export async function runCadastroPasswordMismatchFlow(page: Page) {
  const user = buildRegisterCandidate();
  await page.goto("/register");
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByPlaceholder("Seu nome completo").fill(user.nome);
  await page.getByPlaceholder("seu@universidade.br").fill(user.email);
  await page.getByPlaceholder("Seu registro acadêmico").fill(user.ra);
  await page.getByPlaceholder("Minimo 8 caracteres").fill(user.senha);
  await page.getByPlaceholder("Repita a senha").fill("SenhaDiferente123!");
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page.getByText("As senhas não coincidem.")).toBeVisible();
}

export async function assertUserPersistedIfDbConfigured(email: string) {
  const found = await findUserByEmail(email);
  if (found === null) return false;
  expect(found.email.toLowerCase()).toBe(email.toLowerCase());
  return true;
}
