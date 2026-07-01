import { test, expect } from "@playwright/test";
import {
  prepareProjectWithOwner,
  createProjectViaUi,
  assertProjectInfoVisible,
  assertOwnerActionsVisible,
  assertOwnerActionsHidden,
  assertBackButtonWorks,
  cleanupProject,
} from "./detalhe-projeto.robot";
import { buildLoginCandidate } from "../../factories/auth.factory";
import { LoginPage } from "../../pages/LoginPage";

const API_URL = process.env.VITE_API_URL ?? "http://127.0.0.1:8080";

test.describe("detalhe do projeto real", () => {
  test("exibe informacoes do projeto para o dono", async ({ page, request }) => {
    const owner = await prepareProjectWithOwner(request);
    const loginPage = new LoginPage(page);
    await loginPage.login(owner.email, owner.senha);
    const { projectId, title } = await createProjectViaUi(page);
    const ownerToken = await page.evaluate(() => localStorage.getItem("tcc_auth_token"));
    await page.goto(`/app/projects/${projectId}`);
    await assertProjectInfoVisible(page, title);
    await assertOwnerActionsVisible(page);
    await cleanupProject(request, ownerToken!, projectId);
  });

  test("botoes editar e excluir estao visiveis para o dono", async ({ page, request }) => {
    const owner = await prepareProjectWithOwner(request);
    const loginPage = new LoginPage(page);
    await loginPage.login(owner.email, owner.senha);
    const { projectId } = await createProjectViaUi(page);
    const ownerToken = await page.evaluate(() => localStorage.getItem("tcc_auth_token"));
    await page.goto(`/app/projects/${projectId}`);
    await assertOwnerActionsVisible(page);
    await cleanupProject(request, ownerToken!, projectId);
  });

  test("usuario comum nao ve acoes de edicao/exclusao", async ({ page, request }) => {
    const owner = await prepareProjectWithOwner(request);
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
    await page.goto(`/app/projects/${projectId}`);
    await assertOwnerActionsHidden(page);
    await cleanupProject(request, ownerToken!, projectId);
  });

  test("botao voltar navega para listagem de projetos", async ({ page, request }) => {
    const owner = await prepareProjectWithOwner(request);
    const loginPage = new LoginPage(page);
    await loginPage.login(owner.email, owner.senha);
    const { projectId } = await createProjectViaUi(page);
    const ownerToken = await page.evaluate(() => localStorage.getItem("tcc_auth_token"));
    await page.goto("/app/projects");
    await page.goto(`/app/projects/${projectId}`);
    await assertBackButtonWorks(page);
    await cleanupProject(request, ownerToken!, projectId);
  });
});
