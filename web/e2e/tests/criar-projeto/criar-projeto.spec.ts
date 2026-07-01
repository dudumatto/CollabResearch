import { test, expect } from "@playwright/test";
import {
  prepareOrientadorUser,
  loginAsOrientador,
  fillAndSubmitProject,
  assertEmptyFormValidation,
  assertProjectInListings,
  assertCancelGoesBack,
  cleanupProject,
} from "./criar-projeto.robot";

test.describe("criar projeto real", () => {
  test("cria projeto via formulario e redireciona para detalhe", async ({ page, request }) => {
    const user = await prepareOrientadorUser(request);
    await loginAsOrientador(page, user);
    const draft = await fillAndSubmitProject(page);
    const projectId = Number(page.url().match(/\/projects\/(\d+)$/)?.[1] ?? 0);
    expect(projectId).toBeGreaterThan(0);
    const token = await page.evaluate(() => localStorage.getItem("tcc_auth_token"));
    expect(token).toBeTruthy();
    await cleanupProject(request, token!, projectId);
  });

  test("valida campos obrigatorios ao enviar formulario vazio", async ({ page, request }) => {
    const user = await prepareOrientadorUser(request);
    await loginAsOrientador(page, user);
    await assertEmptyFormValidation(page);
  });

  test("projeto criado aparece na listagem", async ({ page, request }) => {
    const user = await prepareOrientadorUser(request);
    await loginAsOrientador(page, user);
    const draft = await fillAndSubmitProject(page);
    const projectId = Number(page.url().match(/\/projects\/(\d+)$/)?.[1] ?? 0);
    expect(projectId).toBeGreaterThan(0);
    await assertProjectInListings(page, draft.title);
    const token = await page.evaluate(() => localStorage.getItem("tcc_auth_token"));
    expect(token).toBeTruthy();
    await cleanupProject(request, token!, projectId);
  });

  test("botao cancelar volta para listagem de projetos", async ({ page, request }) => {
    const user = await prepareOrientadorUser(request);
    await loginAsOrientador(page, user);
    await assertCancelGoesBack(page);
  });
});
