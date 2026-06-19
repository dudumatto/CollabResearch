import { expect, type Browser, type Page } from "@playwright/test";
import { authenticateAs, expectToast, mockUsers, setupApiMock } from "../../helpers/api-mock.helper";

export async function runApplicationsFilterAndCancelFlow(page: Page) {
  await page.goto("/app/applications");
  await expect(page.getByRole("heading", { name: "Minhas Inscrições", exact: true })).toBeVisible();
  await expect(page.getByText("Total de inscrições")).toBeVisible();
  await expect(page.getByText("Projeto E2E Candidatura").first()).toBeVisible();
  await page.getByRole("button", { name: "Aprovadas" }).first().click();
  await expect(page.getByText("Boa aderencia ao projeto.")).toBeHidden();
  await page.getByText("Projeto E2E Autoria").click();
  await expect(page.getByText("Parecer do orientador:")).toBeVisible();
  await page.getByRole("button", { name: "Todas" }).click();
  await page.getByText("Projeto E2E Candidatura").first().click();
  await expect(page.getByText("Minha motivação:")).toBeVisible();
  await page.getByRole("button", { name: "Ver projeto" }).click();
  await expect(page).toHaveURL(/\/app\/projects\/2$/);
  await page.goto("/app/applications");
  await page.getByText("Projeto E2E Candidatura").first().click();
  await page.getByRole("button", { name: "Cancelar inscrição" }).click();
  await expect(page.getByRole("heading", { name: "Cancelar inscrição" })).toBeVisible();
  await page.getByRole("button", { name: "Confirmar cancelamento" }).click();
  await expectToast(page, "Inscricao cancelada.");
}

export async function runApplicationsEmptyAndErrorFlow(browser: Browser) {
  const emptyContext = await browser.newContext();
  const emptyPage = await emptyContext.newPage();
  await setupApiMock(emptyPage, { empty: { applications: true } });
  await authenticateAs(emptyPage, mockUsers.student);
  await emptyPage.goto("/app/applications");
  await expect(emptyPage.getByText("Nenhuma inscrição encontrada")).toBeVisible();
  await emptyPage.getByRole("button", { name: "Explorar projetos" }).click();
  await expect(emptyPage).toHaveURL(/\/app\/projects$/);
  await emptyContext.close();

  const errorContext = await browser.newContext();
  const errorPage = await errorContext.newPage();
  await setupApiMock(errorPage, { fail: ["/api/usuarios/minhas-inscricoes"] });
  await authenticateAs(errorPage, mockUsers.student);
  await errorPage.goto("/app/applications");
  await expect(errorPage.getByText("Falha ao carregar inscrições")).toBeVisible();
  await errorContext.close();
}
