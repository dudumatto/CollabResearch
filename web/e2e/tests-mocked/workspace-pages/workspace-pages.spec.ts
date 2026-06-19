import { test } from "@playwright/test";
import { authenticateAs, mockUsers, setupApiMock } from "../../helpers/api-mock.helper";
import {
  runDashboardFlow,
  runChatFlow,
  runProgressFlow,
  runFeedbackFlow,
  runProfileFlow,
  runDocumentsFlow,
  runNotificationsFlow,
  runSettingsFlow,
} from "./workspace-pages.robot";

test.describe("paginas internas", () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMock(page);
    await authenticateAs(page, mockUsers.student);
  });

  test("dashboard renderiza resumos e navega para secoes principais", async ({ page }) => runDashboardFlow(page));
  test("chat envia, edita, exclui, busca e lida com lista vazia", async ({ page, browser }) => runChatFlow(page, browser));
  test("progresso publica atualizacao e cobre estado sem projetos", async ({ page, browser }) => runProgressFlow(page, browser));
  test("feedback valida botao desabilitado, envia avaliacao e cobre lista vazia", async ({ page, browser }) => runFeedbackFlow(page, browser));
  test("perfil edita dados e exibe historico academico", async ({ page }) => runProfileFlow(page));
  test("documentos alterna tipo, envia, remove e cobre estado vazio", async ({ page, browser }) => runDocumentsFlow(page, browser));
  test("notificacoes marca como lida, filtra e limpa vista local", async ({ page }) => runNotificationsFlow(page));
  test("configuracoes salva, valida senha, alterna tema e faz logout", async ({ page }) => runSettingsFlow(page));
});
