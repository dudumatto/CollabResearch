import { expect, type APIRequestContext } from "@playwright/test";
import { registerAndLogin, registerAndLoginOrientador, type AuthenticatedUser } from "../../helpers/security.helper";
import { API_URL } from "../../../helpers/api.helper";
import { buildProjectCandidate } from "../../../factories/project.factory";

export type FeedbackScenario = {
  author: AuthenticatedUser;
  outsider: AuthenticatedUser;
  learner: AuthenticatedUser;
  projectId: number;
};

export async function prepareFeedbackScenario(request: APIRequestContext): Promise<FeedbackScenario> {
  const author = await registerAndLogin(request, "ac-fb-author");
  const outsider = await registerAndLogin(request, "ac-fb-outsider");
  const learner = await registerAndLogin(request, "ac-fb-learner");
  const orientador = await registerAndLoginOrientador(request, "ac-fb-orient");

  const areasRes = await request.get(`${API_URL}/api/areas`, {
    headers: { Authorization: `Bearer ${author.token}` },
  });
  const areas = await areasRes.json();

  const draft = buildProjectCandidate();
  const createRes = await request.post(`${API_URL}/api/projetos`, {
    headers: { Authorization: `Bearer ${author.token}` },
    data: {
      titulo: draft.title,
      descricao: draft.description,
      requisitos: draft.requirements,
      vagas: draft.slots,
      areaId: areas[0]?.id,
      orientadorId: orientador.id,
    },
  });
  const project = await createRes.json();
  const projectId = Number(project.id);

  const acceptRes = await request.put(`${API_URL}/api/projetos/${projectId}/aceitar-orientacao`, {
    headers: { Authorization: `Bearer ${orientador.token}` },
  });
  expect(acceptRes.ok(), `Failed to accept project: ${await acceptRes.text()}`).toBeTruthy();

  const applyRes = await request.post(`${API_URL}/api/inscricoes`, {
    headers: { Authorization: `Bearer ${learner.token}` },
    data: { projetoId: projectId, motivacao: "Inscrição para feedback E2E" },
  });
  expect(applyRes.ok(), `Failed to apply: ${await applyRes.text()}`).toBeTruthy();
  const inscription = await applyRes.json();

  const approveRes = await request.put(`${API_URL}/api/inscricoes/${inscription.id}/aprovar`, {
    headers: { Authorization: `Bearer ${orientador.token}` },
    data: { parecerOrientador: "Aprovado" },
  });
  expect(approveRes.ok(), `Failed to approve inscription: ${await approveRes.text()}`).toBeTruthy();

  const feedbackRes = await request.post(`${API_URL}/api/feedback`, {
    headers: { Authorization: `Bearer ${learner.token}` },
    data: {
      projetoId: projectId,
      nota: 5,
      comentario: "Feedback de teste E2E",
    },
  });
  expect(feedbackRes.ok(), `Failed to create feedback: ${await feedbackRes.text()}`).toBeTruthy();

  return { author, outsider, learner, projectId };
}

export async function listFeedbackByProject(request: APIRequestContext, token: string, projectId: number) {
  return request.get(`${API_URL}/api/feedback/projeto/${projectId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function listFeedbackByUser(request: APIRequestContext, token: string, userId: number) {
  return request.get(`${API_URL}/api/feedback/usuario/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function createFeedback(request: APIRequestContext, token: string, projectId: number) {
  return request.post(`${API_URL}/api/feedback`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      projetoId: projectId,
      nota: 4,
      comentario: "Feedback externo",
    },
  });
}
