import { test, expect } from "@playwright/test";
import { authenticateAs, mockUsers, setupApiMock } from "../../helpers/api-mock.helper";
import {
  runProjectsListAndApplyFlow,
  runProjectsCrudFlow,
  runProjectsEmptyAndErrorFlow,
  runProjectApplicationsAccessFlow,
} from "./projects.robot";

test.describe("projetos", () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMock(page);
    await authenticateAs(page, mockUsers.student);
  });

  test("lista, busca, filtros, detalhe e candidatura feliz", async ({ page }) => {
    await runProjectsListAndApplyFlow(page);
  });

  test("cria projeto, valida campos obrigatorios, edita e exclui como dono", async ({ page }) => {
    await runProjectsCrudFlow(page);
  });

  test("exibe estado vazio em busca sem resultados e erro da API", async ({ page }) => {
    await runProjectsEmptyAndErrorFlow(page);
  });

  test("gerenciamento de inscricoes nega aluno e permite orientador aprovar candidato", async ({ browser }) => {
    await runProjectApplicationsAccessFlow(browser);
  });
});
