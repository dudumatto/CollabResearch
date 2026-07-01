import { test, expect } from "@playwright/test";
import {
  preparePublicProfileUser,
  loginAsDifferentUser,
  openUserProfile,
  assertProfileNameVisible,
  assertProfileTypeVisible,
  assertInvalidUserShowsError,
} from "./perfil-publico.robot";

test.describe("perfil publico real", () => {
  test("exibe informacoes publicas do usuario", async ({ page, request }) => {
    const ctx = await preparePublicProfileUser(request);
    await loginAsDifferentUser(page, request);
    await openUserProfile(page, ctx.userId);
    await assertProfileNameVisible(page, "Usuario");
    await assertProfileTypeVisible(page);
  });

  test("id invalido mostra mensagem de erro", async ({ page, request }) => {
    const ctx = await preparePublicProfileUser(request);
    const loginPage = new (await import("../../pages/LoginPage")).LoginPage(page);
    await loginPage.login(ctx.email, ctx.password);
    await assertInvalidUserShowsError(page);
  });
});
