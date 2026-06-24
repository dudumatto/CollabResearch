import { test, expect } from "@playwright/test";
import {
  prepareFeedbackScenario,
  listFeedbackByProject,
  listFeedbackByUser,
  createFeedback,
} from "./feedback.robot";
import { assertForbidden, assertOk } from "../../helpers/security.helper";

test.describe("access control feedback", () => {
  let scenario: Awaited<ReturnType<typeof prepareFeedbackScenario>>;

  test.beforeAll(async ({ request }) => {
    scenario = await prepareFeedbackScenario(request);
  });

  test("autor lista feedbacks por projeto", async ({ request }) => {
    const response = await listFeedbackByProject(request, scenario.author.token, scenario.projectId);
    await assertOk(response);
    const feedbacks = await response.json();
    expect(Array.isArray(feedbacks)).toBeTruthy();
    expect(feedbacks.length).toBeGreaterThan(0);
  });

  test("usuário externo lista feedbacks por projeto (público)", async ({ request }) => {
    const response = await listFeedbackByProject(request, scenario.outsider.token, scenario.projectId);
    await assertOk(response);
  });

  test("autor lista seus feedbacks", async ({ request }) => {
    const response = await listFeedbackByUser(request, scenario.author.token, scenario.author.id);
    await assertOk(response);
  });

  test("usuário externo lista feedbacks de terceiros (público)", async ({ request }) => {
    const response = await listFeedbackByUser(request, scenario.outsider.token, scenario.learner.id);
    await assertOk(response);
  });

  test("aluno aprovado cria feedback em projeto", async ({ request }) => {
    const response = await createFeedback(request, scenario.learner.token, scenario.projectId);
    expect([200, 201, 409]).toContain(response.status());
  });
});
