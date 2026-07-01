import { test, expect } from "@playwright/test";
import {
  prepareEditableProject,
  createProjectViaUi,
  loginAndGotoEdit,
  changeTitleAndSave,
  assertTitlePersisted,
  assertEmptyTitleValidation,
  assertEditBlockedForNonOwner,
  cleanupProject,
} from "./editar-projeto.robot";
import { buildLoginCandidate } from "../../factories/auth.factory";
import { LoginPage } from "../../pages/LoginPage";

const API_URL = process.env.VITE_API_URL ?? "http://127.0.0.1:8080";

test.describe("editar projeto real", () => {
  test("edita titulo do projeto e valida persistencia", async ({ page, request }) => {
    const owner = await prepareEditableProject(request);
    const loginPage = new LoginPage(page);
    await loginPage.login(owner.email, owner.senha);
    const { projectId } = await createProjectViaUi(page);
    const ownerToken = await page.evaluate(() => localStorage.getItem("tcc_auth_token"));
    const newTitle = `Editado E2E ${Date.now()}`;
    await loginAndGotoEdit(page, owner, projectId);
    await changeTitleAndSave(page, newTitle);
    await assertTitlePersisted(page, projectId, newTitle);
    await cleanupProject(request, ownerToken!, projectId);
  });

  test("valida campo titulo obrigatorio", async ({ page, request }) => {
    const owner = await prepareEditableProject(request);
    const loginPage = new LoginPage(page);
    await loginPage.login(owner.email, owner.senha);
    const { projectId } = await createProjectViaUi(page);
    const ownerToken = await page.evaluate(() => localStorage.getItem("tcc_auth_token"));
    await loginAndGotoEdit(page, owner, projectId);
    await assertEmptyTitleValidation(page);
    await cleanupProject(request, ownerToken!, projectId);
  });

  test("usuario sem permissao nao acessa edicao", async ({ page, request }) => {
    const owner = await prepareEditableProject(request);
    const loginPage = new LoginPage(page);
    await loginPage.login(owner.email, owner.senha);
    const { projectId } = await createProjectViaUi(page);
    const ownerToken = await page.evaluate(() => localStorage.getItem("tcc_auth_token"));

    const learner = buildLoginCandidate();
    const learnerRes = await request.post(`${API_URL}/api/auth/register`, {
      data: { nome: learner.nome, email: learner.email, senha: learner.senha, ra: learner.ra },
    });
    expect([200, 409]).toContain(learnerRes.status());
    const loginPage2 = new LoginPage(page);
    await loginPage2.login(learner.email, learner.senha);
    await assertEditBlockedForNonOwner(page, projectId);
    await cleanupProject(request, ownerToken!, projectId);
  });
});
