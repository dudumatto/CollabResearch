import { test, expect } from "@playwright/test";
import { authenticateAs, mockUsers, setupApiMock } from "../../helpers/api-mock.helper";
import {
  runProjectsListAndApplyFlow,
  runProjectsCrudFlow,
  runProjectsEmptyAndErrorFlow,
  runProjectApplicationsAccessFlow,
  runProjectOwnerConfirmationsFlow,
  runProjectDetailSkeletonMobileFlow,
} from "./projects.robot";

test.describe("projetos", () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMock(page, test.info().title.includes("skeleton do detalhe") ? { delay: [{ rule: /^\/api\/projetos\/2$/, ms: 450 }] } : undefined);
    await authenticateAs(page, mockUsers.student);
  });

  test("skeleton do detalhe do projeto fica responsivo no mobile", async ({ page }) => {
    await runProjectDetailSkeletonMobileFlow(page);
  });
  test("lista, busca, filtros, detalhe e candidatura feliz", async ({ page }) => {
    await runProjectsListAndApplyFlow(page);
  });

  test("exibe participantes e oculta mensagem do grupo para aluno que nao integra o projeto", async ({ page }) => {
    await page.goto("/app/projects/4");
    await expect(page.getByRole("heading", { name: "Projeto E2E Nova Inscricao" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Participantes" })).toBeVisible();
    await expect(page.locator(".card-colaboradores").getByText("Prof Ana Orientadora")).toBeVisible();
    await expect(page.locator(".card-colaboradores").getByText("Aluno Externo")).toBeVisible();
    await expect(page.getByRole("button", { name: /Mensagem do grupo/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Editar/i })).toHaveCount(0);

    await page.goto("/app/projects/4/edit");
    await expect(page.getByText("Edição indisponível")).toBeVisible();
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

  test("orientador recebe aviso ao falar consigo e confirma remoção de colaborador", async ({ browser }) => {
    const context = await browser.newContext();
    const advisorPage = await context.newPage();
    await setupApiMock(advisorPage, { user: mockUsers.advisor });
    await authenticateAs(advisorPage, mockUsers.advisor);
    await runProjectOwnerConfirmationsFlow(advisorPage);
    await context.close();
  });
});
