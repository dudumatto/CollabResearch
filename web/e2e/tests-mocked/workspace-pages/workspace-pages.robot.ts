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
  await expect(page.getByText("Linha do tempo")).toBeVisible();
  await page.getByRole("button", { name: "Nova atualização" }).click();
  await page.getByPlaceholder("Descreva a atualização...").fill("Atualização publicada pelo E2E.");
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
  await expect(page.getByRole("button", { name: "Enviar avaliacao" })).toBeDisabled();
  await page.locator(".formulario-avaliacao__select").selectOption({ index: 1 });
  await page.locator(".avaliacao-estrelas__botao").nth(4).click();
  await page.getByPlaceholder("Compartilhe sua experiencia...").fill("Feedback criado pelo E2E.");
  await page.getByRole("button", { name: "Enviar avaliacao" }).click();
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
  await page.goto("/app/profile");
  await expect(page.getByRole("heading", { name: "Meu Perfil", exact: true })).toBeVisible();
  await expect(page.getByText("Informações do perfil")).toBeVisible();
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
  await expect(page.getByText("historico-e2e.pdf")).toBeVisible();
  await page.getByRole("button", { name: /Curr/ }).click();
  const chooserPromise = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Adicionar" }).click();
  const chooser = await chooserPromise;
  await chooser.setFiles({ name: "upload-e2e.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4 e2e") });
  await expect(page.getByText("enviado com sucesso.")).toBeVisible();
  await expect(page.getByText("upload-e2e.pdf")).toBeVisible();
  await page.locator(".documento-item__botao-excluir").first().click();
  await expectToast(page, "Documento removido.");
  const emptyContext = await browser.newContext();
  const emptyPage = await emptyContext.newPage();
  await setupApiMock(emptyPage, { empty: { documents: true } });
  await authenticateAs(emptyPage, mockUsers.student);
  await emptyPage.goto("/app/documents");
  await expect(emptyPage.getByText("Nenhum documento enviado")).toBeVisible();
  await emptyContext.close();
}

export async function runNotificationsFlow(page: Page) {
  await page.goto("/app/notifications");
  await expect(page.getByRole("heading", { name: "Notificações", exact: true })).toBeVisible();
  await expect(page.getByText("Inscricao aprovada", { exact: true })).toBeVisible();
  await page.getByTitle("Marcar como lida").click();
  await expect(page.getByText("Nenhuma nova notificacao")).toBeVisible();
  await page.getByRole("button", { name: /Mensagem recebida/ }).click();
  await expect(page.getByText("Nova mensagem", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Limpar vista local" }).click();
  await expect(page.getByText("Nenhuma notificacao", { exact: true })).toBeVisible();
}

export async function runSettingsFlow(page: Page) {
  await page.goto("/app/configuracoes");
  await expect(page.getByRole("heading", { name: "Configurações", exact: true })).toBeVisible();
  await expect(page.getByText("Perfil")).toBeVisible();
  await page.getByLabel("Alternar modo escuro").click();
  await page.getByRole("button", { name: "Alterar senha" }).first().click();
  await expect(page.getByRole("heading", { name: "Alterar senha" })).toBeVisible();
  await page.getByRole("button", { name: "Confirmar" }).click();
  await expectToast(page, "Preencha todos os campos de senha.");
  await page.getByPlaceholder("Senha atual").fill("SenhaE2E123!");
  await page.getByPlaceholder("Nova senha", { exact: true }).fill("NovaSenha123!");
  await page.getByPlaceholder("Confirmar nova senha").fill("OutraSenha123!");
  await page.getByRole("button", { name: "Confirmar" }).click();
  await expectToast(page, "A confirmação de senha não confere.");
  await page.getByRole("button", { name: "Cancelar" }).click();
  await page.getByRole("button", { name: "Salvar alterações" }).click();
  await expectToast(page, "Configurações salvas com sucesso.");
  await page.getByRole("button", { name: "Logout" }).click();
  await expect.poll(() => page.evaluate(() => localStorage.getItem("tcc_auth_token"))).toBeNull();
}
