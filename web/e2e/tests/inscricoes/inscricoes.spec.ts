import { test } from "@playwright/test";
import {
  applyToProjectViaApi,
  cancelApplicationViaUi,
  loginAndOpenApplications,
  prepareOwnerLearnerAndProject,
  validateApplicationVisibleInUi,
  validateCanceledInApi,
} from "./inscricoes.robot";

test.describe("inscricoes real", () => {
  test("aluno se inscreve, visualiza no frontend, cancela na UI e valida reflexo na API real", async ({ page, request }) => {
    const { learner, projectId, projectTitle } = await prepareOwnerLearnerAndProject(request);
    await applyToProjectViaApi(request, learner, projectId);
    await loginAndOpenApplications(page, learner);
    await validateApplicationVisibleInUi(page, projectTitle);
    await cancelApplicationViaUi(page, projectTitle);
    await validateCanceledInApi(request, learner, projectId);
  });
});
