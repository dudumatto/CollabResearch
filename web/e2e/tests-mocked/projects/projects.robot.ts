import { expect, type Browser, type Page } from "@playwright/test";
import { authenticateAs, expectToast, mockUsers, setupApiMock } from "../../helpers/api-mock.helper";
import { buildProjectDraft } from "../../helpers/test-data.helper";

export async function runProjectsListAndApplyFlow(page: Page) {
  await page.goto("/app/projects");
  await expect(page.getByText("projetos encontrados")).toBeVisible();
  await expect(page.getByText("Projeto E2E Candidatura")).toBeVisible();
  await page.getByPlaceholder("Buscar projetos por titulo, area ou tecnologia...").fill("Candidatura");
  await expect(page.getByText("Projeto E2E Candidatura")).toBeVisible();
  await expect(page.getByText("Projeto E2E Autoria")).toBeHidden();
  await page.getByRole("button", { name: "Filtros" }).click();
  await expect(page.getByText("Area de pesquisa")).toBeVisible();
  await page.locator("select.pagina-projetos__input-filtro-curso").selectOption("Sistemas de Informacao");
  await expect(page.getByText("2 / 3")).toBeVisible();
  await expect(page.getByText("Prof Ana Orientadora (orientador)")).toBeVisible();
  await page.getByText("Projeto E2E Candidatura").click();
  await expect(page).toHaveURL(/\/app\/projects\/2$/);
  await expect(page.getByRole("heading", { name: "Projeto E2E Candidatura" })).toBeVisible();
  await expect(page.getByText("1/3")).toBeVisible();
  await expect(page.getByText("orientador", { exact: true })).toBeVisible();
  await expect(page.getByText("Sobre o projeto")).toBeVisible();
  await page.getByRole("button", { name: "Inscrever-se" }).click();
  await expect(page.getByText("Inscricao no projeto")).toBeVisible();
  await page.getByPlaceholder("Escreva sua motivação para o projeto...").fill("Quero contribuir com a pesquisa.");
  await page.getByRole("button", { name: "Enviar inscrição" }).click();
  await expectToast(page, "Inscricao enviada com sucesso.");
}

export async function runProjectsCrudFlow(page: Page) {
  const project = buildProjectDraft("create-edit");
  await page.goto("/app/projects/new");
  await expect(page.getByRole("heading", { name: "Novo projeto" })).toBeVisible();
  await page.getByRole("button", { name: "Criar projeto" }).click();
  await expect(page.getByText("O titulo e obrigatorio.")).toBeVisible();
  await page.getByPlaceholder("Ex: Sistema de deteccao de anomalias com IA").fill(project.title);
  await page.getByPlaceholder("Descreva os objetivos, metodologia e resultados esperados...").fill(project.description);
  await page.getByPlaceholder("Ex: Conhecimento em Python, estatística básica").fill(project.requirements);
  await page.getByPlaceholder("Ex: React, Spring Boot, PostgreSQL").fill(project.technologies);
  await page.locator("#areaId").selectOption({ index: 1 });
  await page.getByPlaceholder("Ex: 3").fill(String(project.slots));
  await page.getByRole("button", { name: "Criar projeto" }).click();
  await expect(page.getByText("Projeto criado com sucesso! Redirecionando...")).toBeVisible();
  await expect(page).toHaveURL(/\/app\/projects\/\d+$/);
  await expect(page.getByRole("heading", { name: project.title })).toBeVisible();
  await page.getByRole("button", { name: "Editar" }).click();
  await expect(page.getByRole("heading", { name: "Editar projeto" })).toBeVisible();
  await page.locator("#titulo").fill(`${project.title} atualizado`);
  await page.locator("#vagas").fill("4");
  await page.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(page.getByText("Projeto atualizado! Redirecionando...")).toBeVisible();
  await expect(page).toHaveURL(/\/app\/projects\/\d+$/);
  await page.getByRole("button", { name: "Excluir" }).click();
  await expect(page.getByRole("heading", { name: "Excluir projeto" })).toBeVisible();
  await page.locator(".modal-confirmacao").getByRole("button", { name: "Excluir" }).click();
  await expect(page).toHaveURL(/\/app\/projects$/);
}

export async function runProjectsEmptyAndErrorFlow(page: Page) {
  await page.goto("/app/projects");
  await page.getByPlaceholder("Buscar projetos por título, área ou tecnologia...").fill("não existe");
  await expect(page.getByText("Nenhum projeto encontrado")).toBeVisible();
  const errorPage = await page.context().newPage();
  await setupApiMock(errorPage, { fail: [/^\/api\/projetos(?:\?|$)/] });
  await authenticateAs(errorPage, mockUsers.student);
  await errorPage.goto("/app/projects");
  await expect(errorPage.getByText("Falha ao carregar projetos")).toBeVisible();
}

export async function runProjectApplicationsAccessFlow(browser: Browser) {
  const studentContext = await browser.newContext();
  const studentPage = await studentContext.newPage();
  await setupApiMock(studentPage);
  await authenticateAs(studentPage, mockUsers.student);
  await studentPage.goto("/app/projects/2/applications");
  await expect(studentPage.getByText("Acesso negado")).toBeVisible();
  await studentContext.close();
  const advisorContext = await browser.newContext();
  const advisorPage = await advisorContext.newPage();
  await setupApiMock(advisorPage, { user: mockUsers.advisor });
  await authenticateAs(advisorPage, mockUsers.advisor);
  await advisorPage.goto("/app/projects/2/applications");
  await expect(advisorPage.getByRole("heading", { name: "Inscrições no projeto" })).toBeVisible();
  await advisorPage.getByRole("button", { name: "Carta de motivação" }).first().click();
  await expect(advisorPage.getByText("Quero participar deste projeto.")).toBeVisible();
  await advisorPage.getByRole("button", { name: "Aprovar" }).first().click();
  await expect(advisorPage.getByText("Aprovar inscrição")).toBeVisible();
  await advisorPage.getByPlaceholder("Escreva um parecer opcional...").fill("Aprovado no E2E.");
  await advisorPage.getByRole("button", { name: "Confirmar" }).click();
  await expectToast(advisorPage, "Inscricao aprovada.");
  await advisorContext.close();
}
