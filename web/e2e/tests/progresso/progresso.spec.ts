import { expect, test } from "@playwright/test";
import {
  advanceActiveStep,
  assertProgressApi,
  loginAndOpenProgress,
  prepareProgressScenario,
  publishUpdate,
  reloadProgressAndAssert,
} from "./progresso.robot";
import { unique } from "../../helpers/test-data.helper";

test.describe("progresso estruturado", () => {
  test("orientador conclui a etapa ativa e o percentual sobe", async ({ page, request }) => {
    const ctx = await prepareProgressScenario(request);

    await loginAndOpenProgress(page, ctx.orientador);
    await advanceActiveStep(page);

    const login = await request.post("http://127.0.0.1:8080/api/auth/login", {
      data: { email: ctx.orientador.email, senha: ctx.orientador.senha },
    });
    const auth = await login.json();
    const progress = await request.get(`http://127.0.0.1:8080/api/projects/${ctx.projectId}/progress`, {
      headers: { Authorization: `Bearer ${auth.token}` },
    });
    expect(progress.ok()).toBeTruthy();
    const payload = await progress.json();
    expect(payload.overallPercent).toBeGreaterThanOrEqual(10);
    await reloadProgressAndAssert(page, "Etapa 2");
  });

  test("aluno publica atualização com categoria e vê a etapa bloqueada", async ({ page, request }) => {
    const ctx = await prepareProgressScenario(request);

    await loginAndOpenProgress(page, ctx.aluno);
    await test.step("verificar bloqueio da etapa do orientador", async () => {
      const button = page.getByRole("button", { name: /concluir etapa/i }).first();
      await expect(button).toBeVisible();
      await expect(button).toBeDisabled();
    });

    const title = `Atualização ${unique("progress")}`;
    await publishUpdate(page, {
      title,
      category: "meeting",
      description: "Reunião de alinhamento do andamento do projeto.",
    });

    const login = await request.post("http://127.0.0.1:8080/api/auth/login", {
      data: { email: ctx.aluno.email, senha: ctx.aluno.senha },
    });
    const auth = await login.json();
    await assertProgressApi(request, auth.token, ctx.projectId, title);
    await reloadProgressAndAssert(page, title);
  });
});
