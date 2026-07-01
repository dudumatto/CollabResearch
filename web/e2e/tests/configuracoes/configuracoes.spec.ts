import { test, expect } from "@playwright/test";
import {
  prepareSettingsUser,
  loginAndOpenSettings,
  assertSettingsUserVisible,
  openAccountPanel,
  closePanel,
  openAppearancePanel,
  toggleDarkMode,
  assertPageReloadsCorrectly,
} from "./configuracoes.robot";

test.describe("configuracoes real", () => {
  test("pagina carrega com dados do usuario", async ({ page, request }) => {
    const user = await prepareSettingsUser(request);
    await loginAndOpenSettings(page, user);
    await assertSettingsUserVisible(page, user.nome);
  });

  test("abre e fecha painel de informacoes da conta", async ({ page, request }) => {
    const user = await prepareSettingsUser(request);
    await loginAndOpenSettings(page, user);
    await openAccountPanel(page);
    await closePanel(page);
  });

  test("abre painel de aparencia e alterna tema escuro", async ({ page, request }) => {
    const user = await prepareSettingsUser(request);
    await loginAndOpenSettings(page, user);
    await openAppearancePanel(page);
    await toggleDarkMode(page);
  });

  test("recarrega pagina sem quebrar", async ({ page, request }) => {
    const user = await prepareSettingsUser(request);
    await loginAndOpenSettings(page, user);
    await assertPageReloadsCorrectly(page);
  });
});
