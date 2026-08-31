import { expect, test } from "@playwright/test";
import { authenticateAs, mockUsers } from "../../helpers/api-mock.helper";
import { setupAdvisorMock } from "./advisor-workspace.mock";

test.describe("inscricoes do orientador", () => {
  test.beforeEach(async ({ page }) => {
    await setupAdvisorMock(page);
    await authenticateAs(page, mockUsers.advisor);
  });

  test("mostra o botao de perfil ao lado das acoes da inscricao", async ({ page }) => {
    await page.goto("/app/applications");

    const applicationCard = page.locator(".advisor-linha-card", { hasText: "Aluno E2E" }).first();
    await expect(applicationCard).toBeVisible();

    const actions = applicationCard.locator(".advisor-linha-card__acoes");
    await expect(actions.getByRole("button", { name: "Aprovar" })).toBeVisible();

    const profileButton = actions.getByRole("button", { name: "Ver perfil do aluno" });
    await expect(profileButton).toBeVisible();
    await profileButton.click();

    await expect(page).toHaveURL(/\/app\/users\/1$/);
  });

  test("mantem o botao de perfil no modal de decisao", async ({ page }) => {
    await page.goto("/app/applications");

    await page.getByRole("button", { name: "Aprovar" }).first().click();

    const dialog = page.getByRole("dialog", { name: "Decidir inscrição" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("Aluno E2E")).toBeVisible();

    const profileButton = dialog.getByRole("button", { name: "Ver perfil do aluno" });
    await expect(profileButton).toBeVisible();
    await profileButton.click();

    await expect(page).toHaveURL(/\/app\/users\/1$/);
  });
});
