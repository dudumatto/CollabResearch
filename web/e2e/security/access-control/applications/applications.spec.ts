import { test, expect } from "@playwright/test";
import {
  prepareApplicationScenario,
  approveInscription,
  rejectInscription,
  cancelInscription,
  getInscription,
} from "./applications.robot";
import { assertForbidden, assertOk, registerAndLogin } from "../../helpers/security.helper";
import { API_URL } from "../../../helpers/api.helper";
import { cleanupTestData } from "../../../helpers/database-cleanup.helper";
import { verifyTestProfile, setupAdmin } from "../../../helpers/journey.helper";

test.describe("access control inscrições", () => {
  let scenario: Awaited<ReturnType<typeof prepareApplicationScenario>>;
  let adminToken = "";

  test.beforeAll(async ({ request }) => {
    await verifyTestProfile(request);
    const admin = await setupAdmin(request);
    const res = await request.post(`${API_URL}/api/auth/login`, {
      data: { email: admin.email, senha: admin.senha },
    });
    if (res.ok()) {
      const body = await res.json();
      adminToken = body.token;
    }
    scenario = await prepareApplicationScenario(request);
  });

  test.afterEach(async ({ request }) => {
    if (adminToken) await cleanupTestData(request, adminToken);
  });

  test("dono do projeto aprova inscrição", async ({ request }) => {
    const response = await approveInscription(request, scenario.orientador.token, scenario.inscriptionId);
    await assertOk(response);
  });

  test("aluno comum não aprova inscrição", async ({ request }) => {
    const fresh = await registerAndLogin(request, "ac-app-fresh-aprove");
    const applyRes = await request.post(`${API_URL}/api/inscricoes`, {
      headers: { Authorization: `Bearer ${fresh.token}` },
      data: { projetoId: scenario.projectId, motivacao: "Inscrição para teste" },
    });
    expect(applyRes.ok(), `Failed to apply: ${await applyRes.text()}`).toBeTruthy();
    const inscription = await applyRes.json();

    const response = await approveInscription(request, scenario.learner.token, Number(inscription.id));
    await assertForbidden(response);
  });

  test("usuário externo não aprova inscrição", async ({ request }) => {
    const response = await approveInscription(request, scenario.outsider.token, scenario.inscriptionId);
    await assertForbidden(response);
  });

  test("dono do projeto rejeita inscrição", async ({ request }) => {
    const fresh = await registerAndLogin(request, "ac-app-fresh-reject");
    const applyRes = await request.post(`${API_URL}/api/inscricoes`, {
      headers: { Authorization: `Bearer ${fresh.token}` },
      data: { projetoId: scenario.projectId, motivacao: "Inscrição para rejeitar" },
    });
    expect(applyRes.ok(), `Failed to apply: ${await applyRes.text()}`).toBeTruthy();
    const inscription = await applyRes.json();

    const response = await rejectInscription(request, scenario.orientador.token, Number(inscription.id));
    await assertOk(response);
  });

  test("aluno comum não rejeita inscrição", async ({ request }) => {
    const fresh = await registerAndLogin(request, "ac-app-fresh-norej");
    const applyRes = await request.post(`${API_URL}/api/inscricoes`, {
      headers: { Authorization: `Bearer ${fresh.token}` },
      data: { projetoId: scenario.projectId, motivacao: "Inscrição para teste rejeição" },
    });
    expect(applyRes.ok(), `Failed to apply: ${await applyRes.text()}`).toBeTruthy();
    const inscription = await applyRes.json();

    const response = await rejectInscription(request, scenario.learner.token, Number(inscription.id));
    await assertForbidden(response);
  });

  test("aluno cancela sua inscrição", async ({ request }) => {
    const fresh = await registerAndLogin(request, "ac-app-fresh-cancel");
    const applyRes = await request.post(`${API_URL}/api/inscricoes`, {
      headers: { Authorization: `Bearer ${fresh.token}` },
      data: { projetoId: scenario.projectId, motivacao: "Inscrição para cancelar" },
    });
    expect(applyRes.ok(), `Failed to apply: ${await applyRes.text()}`).toBeTruthy();
    const inscription = await applyRes.json();

    const response = await cancelInscription(request, fresh.token, Number(inscription.id));
    expect([200, 204]).toContain(response.status());
  });

  test("usuário externo não cancela inscrição de terceiros", async ({ request }) => {
    const response = await cancelInscription(request, scenario.outsider.token, scenario.inscriptionId);
    await assertForbidden(response);
  });
});