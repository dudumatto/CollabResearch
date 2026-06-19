import { test, expect } from "@playwright/test";
import { authenticateAs, mockUsers, setupApiMock } from "../../helpers/api-mock.helper";
import {
  runApplicationsFilterAndCancelFlow,
  runApplicationsEmptyAndErrorFlow,
} from "./applications.robot";

test.describe("inscricoes do aluno", () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMock(page);
    await authenticateAs(page, mockUsers.student);
  });

  test("filtra, expande, navega para projeto e cancela inscrição pendente", async ({ page }) => {
    await runApplicationsFilterAndCancelFlow(page);
  });

  test("mostra estado vazio e erro de carregamento", async ({ browser }) => {
    await runApplicationsEmptyAndErrorFlow(browser);
  });
});
