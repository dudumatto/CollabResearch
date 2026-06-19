import { test, expect } from "@playwright/test";
import {
  approveOrRejectFromUi,
  assertProjectPersistedViaApi,
  createApplicationViaApi,
  deleteProjectViaApi,
  expectApplicationsRouteForbidden,
  openProjectAndReload,
  prepareAuthenticatedUser,
  runCreateProjectFlow,
  runOpenProjectAndFilter,
  runLoginForProjects,
} from "./projetos.robot";

test.describe("projetos real", () => {
  test("cria projeto no frontend e valida persistencia na API real", async ({ page, request }) => {
    const user = await prepareAuthenticatedUser(request);
    await runLoginForProjects(page, user);

    const project = await runCreateProjectFlow(page);
    const projectId = Number(page.url().match(/\/app\/projects\/(\d+)$/)?.[1] ?? 0);
    expect(projectId).toBeGreaterThan(0);

    const token = await page.evaluate(() => localStorage.getItem("tcc_auth_token"));
    expect(token).toBeTruthy();
    await assertProjectPersistedViaApi(request, token!, projectId, project);
  });

  test("filtra, entra no projeto, aprova/rejeita inscrição e exclui projeto", async ({ page, request }) => {
    const owner = await prepareAuthenticatedUser(request);
    await runLoginForProjects(page, owner);
    const project = await runCreateProjectFlow(page);
    const projectId = Number(page.url().match(/\/app\/projects\/(\d+)$/)?.[1] ?? 0);
    const token = await page.evaluate(() => localStorage.getItem("tcc_auth_token"));
    expect(projectId).toBeGreaterThan(0);
    expect(token).toBeTruthy();

    await runOpenProjectAndFilter(page, project.title);
    await createApplicationViaApi(request, token!, projectId);
    await approveOrRejectFromUi(page, projectId, true);
    await createApplicationViaApi(request, token!, projectId);
    await approveOrRejectFromUi(page, projectId, false);
    await deleteProjectViaApi(request, token!, projectId);
  });

  test("usuário comum não acessa gestão de inscrições e detalhe persiste após refresh", async ({ page, request }) => {
    const owner = await prepareAuthenticatedUser(request);
    await runLoginForProjects(page, owner);
    const project = await runCreateProjectFlow(page);
    const projectId = Number(page.url().match(/\/app\/projects\/(\d+)$/)?.[1] ?? 0);
    const ownerToken = await page.evaluate(() => localStorage.getItem("tcc_auth_token"));
    expect(projectId).toBeGreaterThan(0);
    expect(ownerToken).toBeTruthy();

    await openProjectAndReload(page, projectId, project.title);

    const learner = await prepareAuthenticatedUser(request);
    await runLoginForProjects(page, learner);
    await expectApplicationsRouteForbidden(page, projectId);

    await runLoginForProjects(page, owner);
    await deleteProjectViaApi(request, ownerToken!, projectId);
  });
});
