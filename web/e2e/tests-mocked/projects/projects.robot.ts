import { expect, type Browser, type Page } from "@playwright/test";
import { authenticateAs, expectToast, mockUsers, setupApiMock } from "../../helpers/api-mock.helper";
import { buildProjectDraft } from "../../helpers/test-data.helper";

async function selectComboboxOption(page: Page, name: string | RegExp, option: string) {
  const combobox = page.getByRole("combobox", { name });
  await combobox.click();
  if ((await combobox.getAttribute("aria-expanded")) !== "true") {
    await combobox.press("Enter");
  }
  await expect(combobox).toHaveAttribute("aria-expanded", "true");
  await page.getByRole("listbox").getByRole("option", { name: option }).click();
}

export async function runProjectsListAndApplyFlow(page: Page) {
  await page.goto("/app/projects");
  await expect(page.getByText("projetos vinculados")).toBeVisible();
  await expect(page.getByText("Projeto E2E Candidatura")).toBeVisible();
  await expect(page.getByText("Projeto E2E Finalizado")).toBeVisible();
  await page.getByPlaceholder("Buscar projetos por título, área ou tecnologia...").fill("Candidatura");
  await expect(page.getByText("Projeto E2E Candidatura")).toBeVisible();
  await expect(page.getByText("Projeto E2E Autoria")).toBeHidden();
  await page.getByRole("button", { name: "Filtros" }).click();
  await expect(page.getByText("Área de pesquisa")).toBeVisible();
  await selectComboboxOption(page, "Filtrar por curso", "Sistemas de Informacao");
  await expect(page.getByText("0 / 3")).toBeVisible();
  await expect(page.getByText("Prof Ana Orientadora (orientador)")).toBeVisible();
  await page.getByText("Projeto E2E Candidatura").click();
  await expect(page).toHaveURL(/\/app\/projects\/2$/);
  await expect(page.getByRole("heading", { name: "Projeto E2E Candidatura" })).toBeVisible();
  await expect(page.getByText("3/3")).toBeVisible();
  await expect(page.getByText("Orientador do projeto")).toBeVisible();
  await expect(page.getByText("Sobre o projeto")).toBeVisible();
  await expect(page.getByText("Histórico do projeto")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Cursos elegíveis" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Inscrever-se" })).toHaveCount(0);
  await expect(page.getByText("Sua inscrição está em análise.")).toBeVisible();
  await page.goto("/app/projects/4");
  await expect(page.getByRole("heading", { name: "Projeto E2E Nova Inscricao" })).toBeVisible();
  await page.getByRole("button", { name: "Inscrever-se" }).click();
  await expect(page.getByText("Inscrição no projeto")).toBeVisible();
  await page.getByPlaceholder("Escreva sua motivação para o projeto...").fill("Quero contribuir com a pesquisa.");
  await page.getByRole("button", { name: "Enviar inscrição" }).click();
  await expectToast(page, "Inscrição enviada com sucesso.");
}

export async function runProjectsCrudFlow(page: Page) {
  const project = buildProjectDraft("create-edit");
  await page.goto("/app/projects/new");
  await expect(page.getByRole("heading", { name: "Novo projeto" })).toBeVisible();
  await page.getByRole("button", { name: "Criar projeto" }).click();
  await expect(page.getByText("O título é obrigatório.")).toBeVisible();
  await page.getByPlaceholder("Ex: Sistema de detecção de anomalias com IA").fill(project.title);
  await page.getByPlaceholder("Descreva os objetivos, metodologia e resultados esperados...").fill(project.description);
  await page.getByPlaceholder("Ex: Conhecimento em Python, estatística básica").fill(project.requirements);
  await page.getByPlaceholder("Ex: React, Spring Boot, PostgreSQL").fill(project.technologies);
  await selectComboboxOption(page, /rea de pesquisa/i, "Ciencia da Computacao");
  await selectComboboxOption(page, /orientador/i, "Prof Ana Orientadora");
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
  const deleteDialog = page.getByRole("alertdialog", { name: "Excluir projeto" });
  await expect(deleteDialog).toBeVisible();
  await deleteDialog.getByRole("button", { name: "Cancelar" }).click();
  await expect(deleteDialog).toBeHidden();
  await page.getByRole("button", { name: "Excluir" }).click();
  await page.getByRole("alertdialog", { name: "Excluir projeto" }).getByRole("button", { name: "Excluir" }).click();
  await expect(page).toHaveURL(/\/app\/projects$/);
}

export async function runProjectOwnerConfirmationsFlow(page: Page) {
  await page.goto("/app/projects/2");

  await page.getByRole("button", { name: "Enviar mensagem" }).click();
  await expectToast(page, "Você é o orientador deste projeto e não pode enviar uma mensagem para si mesmo. Use a conversa do grupo.");

  const removeButton = page.getByRole("button", { name: "Remover Aluno Colaborador" });
  await removeButton.click();
  const removeDialog = page.getByRole("alertdialog", { name: "Remover colaborador" });
  await expect(removeDialog).toContainText("Aluno Colaborador");
  await expect(removeDialog.getByRole("button", { name: "Cancelar" })).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(removeDialog.getByRole("button", { name: "Remover" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(removeDialog.getByRole("button", { name: "Cancelar" })).toBeFocused();
  await removeDialog.getByRole("button", { name: "Cancelar" }).click();
  await expect(removeDialog).toBeHidden();
  await expect(removeButton).toBeFocused();

  await removeButton.click();
  await removeDialog.getByRole("button", { name: "Remover" }).click();
  await expectToast(page, "Colaborador removido.");
  await expect(page.getByText("Aluno Colaborador", { exact: true })).toHaveCount(0);

  const deleteProjectButton = page.getByRole("button", { name: "Excluir" });
  await deleteProjectButton.click();
  const deleteProjectDialog = page.getByRole("alertdialog", { name: "Excluir projeto" });
  await expect(deleteProjectDialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(deleteProjectDialog).toBeHidden();
  await expect(deleteProjectButton).toBeFocused();
}

export async function runProjectsEmptyAndErrorFlow(page: Page) {
  await page.goto("/app/projects");
  await page.getByPlaceholder("Buscar projetos por título, área ou tecnologia...").fill("não existe");
  await expect(page.getByText("Nenhum projeto encontrado")).toBeVisible();
  const errorPage = await page.context().newPage();
  await setupApiMock(errorPage, { fail: [/^\/api\/projetos\/pagina(?:\?|$)/] });
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
  await expect(studentPage).toHaveURL(/\/app$/);
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
  await expectToast(advisorPage, "Inscrição aprovada.");
  await advisorContext.close();
}

export async function runProjectDetailSkeletonMobileFlow(page: Page) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/app/projects/2");
  const skeleton = page.locator(".pagina-detalhe-projeto--skeleton");
  await expect(skeleton).toBeVisible();
  const layout = await skeleton.evaluate((element) => {
    const viewportWidth = window.innerWidth;
    const rects = Array.from(element.querySelectorAll(".skeleton, .detalhe-card--skeleton"))
      .map((item) => item.getBoundingClientRect());
    return {
      viewportWidth,
      pageWidth: element.getBoundingClientRect().width,
      maxRight: Math.max(...rects.map((rect) => rect.right)),
      minLeft: Math.min(...rects.map((rect) => rect.left)),
    };
  });
  expect(layout.pageWidth).toBeLessThanOrEqual(layout.viewportWidth);
  expect(layout.minLeft).toBeGreaterThanOrEqual(0);
  expect(layout.maxRight).toBeLessThanOrEqual(layout.viewportWidth);

  await expect(page.getByRole("heading", { name: "Projeto E2E Candidatura" })).toBeVisible();
}