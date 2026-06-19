import { test } from "@playwright/test";
import { mockUsers } from "../../helpers/api-mock.helper";
import { runApiErrorScenario } from "./api-error-states.robot";

const cases = [
  {
    name: "dashboard",
    path: "/app",
    fail: /^\/api\/projetos$/,
    expected: "Falha ao carregar",
  },
  {
    name: "detalhe de projeto",
    path: "/app/projects/1",
    fail: /^\/api\/projetos\/1$/,
    expected: "Projeto indisponivel",
  },
  {
    name: "inscricoes do projeto",
    path: "/app/projects/2/applications",
    fail: /^\/api\/inscricoes\/projeto\/2$/,
    expected: "Não foi possível carregar",
    user: mockUsers.advisor,
  },
  {
    name: "documentos",
    path: "/app/documents",
    fail: /^\/api\/documentos\/usuario\/1$/,
    expected: "Falha ao carregar documentos",
  },
  {
    name: "notificacoes",
    path: "/app/notifications",
    fail: /^\/api\/notificacoes$/,
    expected: "Falha ao carregar notificacoes",
  },
  {
    name: "chat",
    path: "/app/chat",
    fail: /^\/api\/conversas\/1\/todas$/,
    expected: "Falha ao carregar",
  },
];

test.describe("estados tristes de API", () => {
  for (const scenario of cases) {
    test(`${scenario.name} mostra erro controlado`, async ({ page }) => {
      await runApiErrorScenario(page, scenario);
    });
  }
});
