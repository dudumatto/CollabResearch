import { expect, test } from "@playwright/test";
import { authenticateAs, mockUsers, setupApiMock } from "../../helpers/api-mock.helper";
import {
  runDashboardFlow,
  runChatFlow,
  runDeadlinesFlow,
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
  test("calendario adapta layout e corta texto sem reticencias", async ({ page }) => runDeadlinesFlow(page));
  test("chat envia, edita, exclui, busca e lida com lista vazia", async ({ page, browser }) => runChatFlow(page, browser));
  test("progresso publica atualizacao e cobre estado sem projetos", async ({ page, browser }) => runProgressFlow(page, browser));
  test("progresso respeita paleta dark do aplicativo", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("tcc_theme", "dark");
    });

    await page.goto("/app/progress");
    await expect(page.locator("html")).toHaveClass(/dark/);
    await expect(page.getByRole("heading", { name: "Progresso do projeto", exact: true })).toBeVisible();

    const colors = await page.locator(".progress-page").evaluate((element) => {
      const pageStyle = getComputedStyle(element);
      const panelStyle = getComputedStyle(element.querySelector(".progress-page__panel"));
      const cardStyle = getComputedStyle(element.querySelector(".step-card"));
      const inputStyle = getComputedStyle(element.querySelector(".app-combobox"));

      return {
        panel: panelStyle.backgroundColor,
        card: cardStyle.backgroundColor,
        input: inputStyle.backgroundColor,
        border: pageStyle.getPropertyValue("--progress-border").trim(),
        textMuted: pageStyle.getPropertyValue("--progress-text-muted").trim(),
      };
    });

    expect(Object.values(colors).join(" ")).not.toContain("15, 23, 42");
    expect(Object.values(colors).join(" ")).not.toContain("30, 41, 59");
    expect(Object.values(colors).join(" ")).not.toContain("148, 163, 184");
  });
  test("feedback valida botao desabilitado, envia avaliacao e cobre lista vazia", async ({ page, browser }) => runFeedbackFlow(page, browser));
  test("perfil edita dados e exibe historico academico", async ({ page }) => runProfileFlow(page));
  test("documentos lista, remove e cobre estado vazio", async ({ page, browser }) => runDocumentsFlow(page, browser));
  test("notificacoes marca como lida, filtra e limpa vista local", async ({ page }) => runNotificationsFlow(page));
  test("configuracoes salva, valida senha, alterna tema e faz logout", async ({ page }) => runSettingsFlow(page));
});

test.describe("configuracoes compartilhadas", () => {
  test("orientador usa a mesma pagina e componentes de aparencia do aluno", async ({ page }) => {
    await setupApiMock(page, { user: mockUsers.advisor });
    await authenticateAs(page, mockUsers.advisor);

    await runSettingsFlow(page, "Orientador");
  });
});
