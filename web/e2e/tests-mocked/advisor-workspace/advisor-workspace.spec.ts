import { expect, test } from "@playwright/test";
import { authenticateAs, mockUsers } from "../../helpers/api-mock.helper";
import { setupAdvisorMock } from "./advisor-workspace.mock";

const VIEWPORTS = [
  { name: "1440x900", width: 1440, height: 900 },
  { name: "1024x768", width: 1024, height: 768 },
  { name: "390x844", width: 390, height: 844 },
];

const PAGINAS = [
  { nome: "dashboard", rota: "/app", pistas: ["Olá, Prof!"] },
  { nome: "projetos", rota: "/app/projects", pistas: ["Projeto E2E Autoria"] },
  { nome: "inscricoes", rota: "/app/applications", pistas: ["Inscrições recebidas"] },
  { nome: "orientandos", rota: "/app/advisees", pistas: ["Aluno E2E"] },
  { nome: "orientando-detalhe", rota: "/app/advisees/1", pistas: ["Histórico de participação"] },
  { nome: "progresso", rota: "/app/progress", pistas: ["Progresso e prazos"] },
  { nome: "entregas", rota: "/app/deliveries", pistas: ["Monografia"] },
  { nome: "avaliacoes", rota: "/app/avaliacoes", pistas: ["Avaliações acadêmicas"] },
  { nome: "perfil", rota: "/app/profile", pistas: ["Salvar alterações"] },
];

test.describe("area do orientador (mockada)", () => {
  test.beforeEach(async ({ page }) => {
    await setupAdvisorMock(page);
    await authenticateAs(page, mockUsers.advisor);
  });

  for (const pagina of PAGINAS) {
    test(`${pagina.nome} renderiza nos 3 viewports`, async ({ page }) => {
      for (const vp of VIEWPORTS) {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto(pagina.rota);
        await expect(page.locator(".advisor-pagina")).toBeVisible();

        for (const pista of pagina.pistas) {
          await expect(page.getByText(pista).first()).toBeVisible();
        }

        await expect
          .poll(async () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth))
          .toBeLessThanOrEqual(2);

        await page.screenshot({
          path: `e2e/results/advisor/${pagina.nome}-${vp.name}.png`,
          fullPage: false,
        });
      }
    });
  }

  test("dashboard limita a pre-visualizacao das filas a 2 itens", async ({ page }) => {
    await page.goto("/app");

    const activeProjectsCard = page.locator(".advisor-card", { hasText: "Projetos ativos" });
    await expect(activeProjectsCard.locator(".advisor-card__contador")).toHaveText("3");
    await expect(activeProjectsCard.locator(".advisor-fila-item")).toHaveCount(2);
    await expect(activeProjectsCard.getByText("Projeto extra oculto")).toHaveCount(0);
  });
});
