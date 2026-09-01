import { expect, type Browser, type Page } from "@playwright/test";
import { authenticateAs, expectToast, mockUsers, setupApiMock } from "../../helpers/api-mock.helper";

export async function runDashboardFlow(page: Page) {
  await page.goto("/app");
  await expect(page.getByRole("heading", { name: "Dashboard", exact: true })).toBeVisible();
  await expect(page.getByText("Projetos recentes")).toBeVisible();
  await expect(page.getByText("Minhas inscrições")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Notificações" })).toBeVisible();
  await expect(page.locator(".painel__card--recentes .inscricao-item")).toHaveCount(2);
  await expect(page.locator(".painel__card--inscricoes .inscricao-item")).toHaveCount(2);
  await expect(page.locator(".painel__card-projetos-sugeridos .projeto-sugerido")).toHaveCount(2);
  await expect(page.locator(".painel__card--notificacoes .notificacao-resumo")).toHaveCount(2);
  await page.locator(".painel__card--recentes").getByRole("button", { name: /Abrir informações do projeto Projeto E2E Autoria/ }).click();
  await expect(page).toHaveURL(/\/app\/projects\/1$/);
  await expect(page.getByRole("heading", { name: "Projeto E2E Autoria", exact: true })).toBeVisible();
  await page.goto("/app");
  await page.getByRole("button", { name: /Buscar projetos/ }).click();
  await expect(page).toHaveURL(/\/app\/projects$/);
}

export async function runDeadlinesFlow(page: Page) {
  for (const viewport of [
    { width: 1280, height: 820 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/app/deadlines");

    await expect(page.getByRole("heading", { name: "Prazos das etapas", exact: true })).toBeVisible();
    await expect(page.getByText("Este mês", { exact: true })).toBeVisible();

    const longDelivery = page.locator(".calendario-lista").getByText("Entrega parcial com titulo muito longo");
    for (let attempts = 0; attempts < 3 && await longDelivery.count() === 0; attempts += 1) {
      await page.getByRole("button", { name: "Mês anterior" }).click();
    }

    await expect(longDelivery).toBeVisible();
    await expect(page.locator(".calendario-card--lateral").filter({ hasText: "Este mês" }).getByText("Revisao final")).toBeVisible();
    await expect(page.locator(".calendario-card--alerta").getByText("Etapa sem data sem prazo")).toBeVisible();
    await expect(page.locator(".calendario-evento__rotulo").first()).toHaveCSS("text-overflow", "clip");
    await expect
      .poll(async () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth))
      .toBeLessThanOrEqual(2);

    const calendarBox = await page.locator(".calendario-card--principal").boundingBox();
    const originalUrl = page.url();
    await expect(page.locator(".calendario-dia--fora .calendario-dia__tooltip")).toHaveCount(0);
    await page.locator(".calendario-dia--com-evento:not(.calendario-dia--fora)").first().click();
    const tooltip = page.locator(".calendario-dia__tooltip").first();
    await expect(tooltip).toBeVisible();
    const tooltipBox = await tooltip.boundingBox();
    expect(tooltipBox?.x ?? 0).toBeGreaterThanOrEqual(0);
    expect(tooltipBox?.y ?? 0).toBeGreaterThanOrEqual(0);
    expect((tooltipBox?.x ?? 0) + (tooltipBox?.width ?? 0)).toBeLessThanOrEqual(viewport.width);
    expect((tooltipBox?.y ?? 0) + (tooltipBox?.height ?? 0)).toBeLessThanOrEqual(viewport.height);
    await expect(tooltip).toHaveCSS("z-index", "10000");
    await page.getByRole("heading", { name: "Prazos das etapas", exact: true }).click();
    await expect(tooltip).toBeHidden();
    await expect(page).toHaveURL(originalUrl);

    if (viewport.width > 1119) {
      await expect
        .poll(async () => page.evaluate(() => document.documentElement.scrollHeight - document.documentElement.clientHeight))
        .toBeLessThanOrEqual(2);

      const lateralBox = await page.locator(".calendario-lateral").boundingBox();
      const lateralCards = await page.locator(".calendario-card--lateral").evaluateAll((cards) =>
        cards.map((card) => card.getBoundingClientRect().height),
      );
      expect(Math.abs((calendarBox?.height ?? 0) - (lateralBox?.height ?? 0))).toBeLessThanOrEqual(2);
      expect(Math.abs((lateralCards[0] ?? 0) - (lateralCards[1] ?? 0))).toBeLessThanOrEqual(2);
    } else {
      expect(calendarBox?.height ?? 0).toBeLessThanOrEqual(430);
    }
  }
}

export async function runChatFlow(page: Page, browser: Browser) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/app/chat");
  await expect(page.locator(".barra-topo__titulo")).toHaveText("Mensagens");
  await page.locator(".conversa-item", { hasText: "Projeto E2E Candidatura" }).click();
  await expect(page.locator(".pagina-chat__topo-conversa")).toBeVisible();
  await expect(page.getByRole("button", { name: "Voltar para a lista de conversas" })).toBeVisible();
  const mobileChatLayout = await page.evaluate(() => {
    const topbar = document.querySelector(".barra-topo");
    const content = document.querySelector(".pagina-app__conteudo");
    const messages = document.querySelector(".pagina-chat__mensagens");
    const input = document.querySelector(".pagina-chat__area-input");
    const conversationTop = document.querySelector(".pagina-chat__topo-conversa");
    if (!topbar || !content || !messages || !input || !conversationTop) return null;
    messages.scrollTop = messages.scrollHeight;
    const contentStyle = window.getComputedStyle(content);
    const messagesStyle = window.getComputedStyle(messages);
    const topbarRect = topbar.getBoundingClientRect();
    const contentRect = content.getBoundingClientRect();
    const topRect = conversationTop.getBoundingClientRect();
    const inputRect = input.getBoundingClientRect();
    return {
      contentOverflow: contentStyle.overflowY,
      messagesOverflow: messagesStyle.overflowY,
      messagesHeight: messages.getBoundingClientRect().height,
      topbarVisible: topbarRect.top >= 0 && topbarRect.bottom <= window.innerHeight,
      topVisible: topRect.top >= 0 && topRect.bottom <= window.innerHeight,
      inputVisible: inputRect.top >= 0 && inputRect.bottom <= window.innerHeight,
      contentFitsViewport: contentRect.bottom <= window.innerHeight + 2,
    };
  });
  expect(mobileChatLayout?.contentOverflow).toBe("hidden");
  expect(mobileChatLayout?.messagesOverflow).toBe("auto");
  expect(mobileChatLayout?.messagesHeight ?? 0).toBeGreaterThan(120);
  expect(mobileChatLayout?.topbarVisible).toBeTruthy();
  expect(mobileChatLayout?.topVisible).toBeTruthy();
  expect(mobileChatLayout?.inputVisible).toBeTruthy();
  expect(mobileChatLayout?.contentFitsViewport).toBeTruthy();

  await page.setViewportSize({ width: 1280, height: 720 });
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
  await lastUserMessage.getByRole("button", { name: "Ações da mensagem" }).click();
  await lastUserMessage.getByRole("menuitem", { name: "Editar mensagem" }).click();
  await expect(page.getByText("Editar mensagem")).toBeVisible();
  await page.locator(".modal__textarea").fill("Mensagem editada E2E");
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByText("Mensagem editada E2E")).toBeVisible();
  await lastUserMessage.hover();
  await lastUserMessage.getByRole("button", { name: "Ações da mensagem" }).click();
  await lastUserMessage.getByRole("menuitem", { name: "Excluir mensagem" }).click();
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
  await expect(page.getByRole("heading", { name: "Progresso do projeto", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Entrega parcial com titulo muito longo para validar corte sem tres pontos" })).toBeVisible();
  await expect(page.getByText("Mover").first()).toBeVisible();
  await expect(page.locator(".progress-page__grid")).toHaveCSS("align-items", "start");
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
  await expect(page.getByText("Dados do perfil")).toBeVisible();
  await expect(page.getByText("Conta autenticada via API")).toHaveCount(0);
  await expect(page.getByText("Tema visual")).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  const emailWrap = page.locator(".student-profile-standard__input-wrap", { has: page.locator("#perfil-email") });
  const spacing = await emailWrap.evaluate((element) => {
    const icon = element.querySelector(".student-profile-standard__input-icon");
    const input = element.querySelector("#perfil-email");
    if (!icon || !input) return null;
    const iconRect = icon.getBoundingClientRect();
    const inputStyle = getComputedStyle(input);
    return {
      reservedLeft: Number.parseFloat(inputStyle.paddingLeft),
      iconRight: iconRect.left - input.getBoundingClientRect().left + iconRect.width,
    };
  });
  expect(spacing?.reservedLeft ?? 0).toBeGreaterThan((spacing?.iconRight ?? 0) + 8);
  await expect(page.locator(".advisor-perfil-cartao__avatar")).toHaveText("AE");
  await expect(page.locator(".advisor-perfil-cartao__foto")).toHaveCount(0);
  await page.unroute("**/api/usuarios/me");
  await page.getByRole("button", { name: "Editar perfil" }).click();
  await page.locator("#perfil-nome").fill("Aluno E2E Atualizado");
  await page.getByRole("button", { name: "Salvar" }).click();
  await expectToast(page, "Perfil atualizado com sucesso.");
  await expect(page.locator("#perfil-nome")).toHaveValue("Aluno E2E Atualizado");
  await expect(page.getByText("Currículos e documentos")).toBeVisible();
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
  await expect(page.getByText("2 notificações disponíveis")).toBeVisible();
  await page.locator(".notificacao-item").filter({ hasText: "Nova mensagem" }).click();
  await expect(page.getByText("Nova mensagem", { exact: true })).toBeHidden();
  await page.getByRole("button", { name: "Limpar vista local" }).click();
  await expect(page.getByRole("heading", { name: "Nenhuma notificação", exact: true })).toBeVisible();
}

export async function runSettingsFlow(page: Page, expectedRole = "Aluno") {
  await page.goto("/app/configuracoes");
  await expect(page.getByRole("heading", { name: "Configurações", exact: true })).toBeVisible();
  await expect(page.getByText("Informações da conta")).toBeVisible();
  await expect(page.getByRole("button", { name: /Aparência/ })).toBeVisible();

  await page.getByRole("button", { name: /Informações da conta/ }).click();
  await expect(page.getByText("Nome completo")).toBeVisible();
  await expect(page.getByText("Função", { exact: true })).toBeVisible();
  await expect(page.locator(".cfg-readonly").filter({ hasText: expectedRole })).toBeVisible();
  await page.getByRole("button", { name: "Salvar alterações" }).click();
  await expectToast(page, "Configurações salvas com sucesso.");

  await page.getByRole("button", { name: /Aparência/ }).click();
  const appearancePanel = page.locator(".cfg-panel");
  await expect(appearancePanel.getByRole("radio", { name: /Claro/ })).toBeVisible();
  await expect(appearancePanel.getByText("Tamanho da fonte")).toBeHidden();
  await appearancePanel.getByRole("radio", { name: /Escuro/ }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme-preference", "dark");
  await page.locator(".cfg-panel__back").click();
  await expect(page.locator(".cfg-panel__back")).toBeHidden();

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
