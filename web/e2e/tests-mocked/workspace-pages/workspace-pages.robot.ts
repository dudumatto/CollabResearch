import { expect, type Browser, type Page } from "@playwright/test";
import { authenticateAs, expectToast, mockUsers, setupApiMock } from "../../helpers/api-mock.helper";

export async function runDashboardFlow(page: Page) {
  await page.goto("/app");
  await expect(page.getByRole("heading", { name: "Dashboard", exact: true })).toBeVisible();
  await expect(page.getByText("Projetos recentes")).toBeVisible();
  await expect(page.getByText("Minhas inscrições")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Notificações" })).toBeVisible();
  await page.getByRole("button", { name: /Buscar projetos/ }).click();
  await expect(page).toHaveURL(/\/app\/projects$/);
}

export async function runChatFlow(page: Page, browser: Browser) {
  await page.goto("/app/chat");
  await expect(page.locator(".barra-topo__titulo")).toHaveText("Mensagens");
  await expect(page.getByText("Projeto E2E Candidatura").first()).toBeVisible();
  await page.getByPlaceholder("Buscar conversa").fill("Candidatura");
  await expect(page.getByText("Projeto E2E Candidatura").first()).toBeVisible();
  await page.getByPlaceholder("Digite uma mensagem").fill("Mensagem nova E2E");
  await page.locator(".pagina-chat__botao-enviar").click();
  await expect(page.getByText("Mensagem nova E2E")).toBeVisible();
  const lastUserMessage = page.locator(".mensagem-linha--usuario").last();
  await lastUserMessage.hover();
  await lastUserMessage.locator(".mensagem-acao-btn").first().click();
  await expect(page.getByText("Editar mensagem")).toBeVisible();
  await page.locator(".modal__textarea").fill("Mensagem editada E2E");
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByText("Mensagem editada E2E")).toBeVisible();
  await lastUserMessage.hover();
  await lastUserMessage.locator(".mensagem-acao-btn--excluir").click();
  await expect(page.getByText("Excluir mensagem")).toBeVisible();
  await page.locator(".modal").getByRole("button", { name: "Excluir" }).click();
  await expect(page.getByText("Mensagem editada E2E")).toBeHidden();
  const emptyContext = await browser.newContext();
  const emptyPage = await emptyContext.newPage();
  await setupApiMock(emptyPage, { empty: { conversations: true } });
  await authenticateAs(emptyPage, mockUsers.student);
  await emptyPage.goto("/app/chat");
  await expect(emptyPage.getByText(/nenhuma conversa/)).toBeVisible();
  await emptyContext.close();
}

export async function runProgressFlow(page: Page, browser: Browser) {
  await page.goto("/app/progress");
  await expect(page.getByRole("heading", { name: "Progresso do Projeto", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Feed de atualizações" })).toBeVisible();
  await page.getByRole("button", { name: "Nova atualização" }).click();
  await page.getByPlaceholder("Ex.: Capítulo 2 escrito").fill("Atualização publicada pelo E2E.");
  await page.getByRole("button", { name: "Publicar" }).click();
  await expectToast(page, "Atualização publicada com sucesso.");
  await expect(page.getByText("Atualização publicada pelo E2E.").first()).toBeVisible();
  const emptyContext = await browser.newContext();
  const emptyPage = await emptyContext.newPage();
  await setupApiMock(emptyPage, { empty: { projects: true } });
  await authenticateAs(emptyPage, mockUsers.student);
  await emptyPage.goto("/app/progress");
  await expect(emptyPage.getByText("Sem projetos vinculados")).toBeVisible();
  await emptyContext.close();
}

export async function runFeedbackFlow(page: Page, browser: Browser) {
  await page.goto("/app/feedback");
  await expect(page.getByRole("heading", { name: "Feedback", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Feedbacks recebidos" })).toBeVisible();
  await page.getByRole("button", { name: "Avaliar" }).click();
  await expect(page.getByRole("button", { name: "Enviar avaliação" })).toBeDisabled();
  await page.locator(".formulario-avaliacao__select").selectOption({ index: 1 });
  await page.locator(".avaliacao-estrelas__botao").nth(4).click();
  await page.getByPlaceholder("Compartilhe sua experiência...").fill("Feedback criado pelo E2E.");
  await page.getByRole("button", { name: "Enviar avaliação" }).click();
  await expectToast(page, "Feedback enviado com sucesso.");
  await expect(page.getByText("Feedback enviado!")).toBeVisible();
  const emptyContext = await browser.newContext();
  const emptyPage = await emptyContext.newPage();
  await setupApiMock(emptyPage, { empty: { feedbacks: true } });
  await authenticateAs(emptyPage, mockUsers.student);
  await emptyPage.goto("/app/feedback");
  await expect(emptyPage.getByText("Nenhum feedback ainda")).toBeVisible();
  await emptyContext.close();
}

export async function runProfileFlow(page: Page) {
  await page.route("**/api/usuarios/me", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ...mockUsers.student,
        fotoPerfilUrl: "/foto-perfil-inexistente.png",
      }),
    });
  });
  await page.goto("/app/profile");
  await expect(page.getByRole("heading", { name: "Meu Perfil", exact: true })).toBeVisible();
  await expect(page.getByText("Informações do perfil")).toBeVisible();
  await expect(page.getByText("Conta autenticada via API")).toHaveCount(0);
  await expect(page.getByText("Tema visual")).toHaveCount(0);
  await expect(page.locator(".cartao-perfil__avatar-inicial")).toHaveText("AE");
  await expect(page.locator(".cartao-perfil__avatar img")).toHaveCount(0);
  await page.unroute("**/api/usuarios/me");
  await page.getByRole("button", { name: "Editar perfil" }).click();
  await page.locator(".campo-perfil__input--editando").first().fill("Aluno E2E Atualizado");
  await page.getByRole("button", { name: "Salvar" }).click();
  await expectToast(page, "Perfil atualizado com sucesso.");
  await expect(page.locator(".campo-perfil__input").first()).toHaveValue("Aluno E2E Atualizado");
  await expect(page.getByText("Histórico acadêmico")).toBeVisible();
}

export async function runDocumentsFlow(page: Page, browser: Browser) {
  await page.goto("/app/documents");
  await expect(page.getByRole("heading", { name: "Documentos", exact: true })).toBeVisible();
  await expect(page.getByText("Curriculo e documentos")).toBeVisible();
  await expect(page.getByText("historico-e2e.pdf")).toBeVisible();
  await page.locator(".perfil-documentos__item").filter({ hasText: "historico-e2e.pdf" }).getByTitle("Remover documento").click();
  await expectToast(page, "Documento removido.");
  await expect(page.getByText("historico-e2e.pdf")).toBeHidden();
  const emptyContext = await browser.newContext();
  const emptyPage = await emptyContext.newPage();
  await setupApiMock(emptyPage, { empty: { documents: true } });
  await authenticateAs(emptyPage, mockUsers.student);
  await emptyPage.goto("/app/documents");
  await expect(emptyPage.getByText("Nenhum documento")).toBeVisible();
  await emptyContext.close();
}

export async function runNotificationsFlow(page: Page) {
  await page.goto("/app/notifications");
  await expect(page.getByRole("heading", { name: "Notificações", exact: true })).toBeVisible();
  await expect(page.getByText("Inscrição aprovada", { exact: true })).toBeVisible();
  await page.getByTitle("Marcar como lida").click();
  await expect(page.getByText("Nenhuma nova notificação")).toBeVisible();
  await page.getByRole("button", { name: /Mensagem recebida/ }).click();
  await expect(page.getByText("Nova mensagem", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Limpar vista local" }).click();
  await expect(page.getByText("Nenhuma notificação", { exact: true })).toBeVisible();
}

export async function runSettingsFlow(page: Page) {
  await page.goto("/app/configuracoes");
  await expect(page.getByRole("heading", { name: "Configurações", exact: true })).toBeVisible();
  await expect(page.getByText("Informações da conta")).toBeVisible();
  await expect(page.getByText("Visibilidade do perfil")).toBeVisible();

  await page.getByRole("button", { name: /Informações da conta/ }).click();
  await expect(page.getByText("Nome completo")).toBeVisible();
  await expect(page.getByText("Função", { exact: true })).toBeVisible();
  await expect(page.locator(".cfg-readonly").filter({ hasText: "Aluno" })).toBeVisible();
  await page.getByRole("button", { name: "Salvar alterações" }).click();
  await expectToast(page, "Configurações salvas com sucesso.");

  await page.getByRole("button", { name: /Alterar senha/ }).click();
  const passwordPanel = page.locator(".cfg-panel");
  await expect(passwordPanel.getByText("A senha deve conter:")).toBeVisible();
  await passwordPanel.getByRole("button", { name: "Alterar senha" }).click();
  await expectToast(page, "Preencha todos os campos de senha.");
  await passwordPanel.getByPlaceholder("••••••••").nth(0).fill("SenhaE2E123!");
  await passwordPanel.getByPlaceholder("••••••••").nth(1).fill("NovaSenha123!");
  await passwordPanel.getByPlaceholder("••••••••").nth(2).fill("OutraSenha123!");
  await passwordPanel.getByRole("button", { name: "Alterar senha" }).click();
  await expectToast(page, "A confirmação de senha não confere.");
  await page.locator(".cfg-panel__back").click();
  await expect(page.locator(".cfg-panel__back")).toBeHidden();

  await page.getByRole("button", { name: /Sair da conta/ }).click();
  await expect(page.getByText("Sair da conta?")).toBeVisible();
  await page.getByRole("button", { name: "Confirmar saída" }).click();
  await expect.poll(() => page.evaluate(() => localStorage.getItem("tcc_auth_token"))).toBeNull();
}
