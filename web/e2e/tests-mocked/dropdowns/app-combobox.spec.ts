import { expect, test, type Page } from "@playwright/test";
import { authenticateAs, mockUsers, setupApiMock } from "../../helpers/api-mock.helper";

async function selectComboboxOption(page: Page, name: RegExp, optionName: string | RegExp, selectedText: string | RegExp) {
  const combo = page.getByRole("combobox", { name });
  await expect(combo).toBeEnabled();
  await combo.click();
  await expect(combo).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("listbox")).toBeVisible();

  const option = page.getByRole("option", { name: optionName }).filter({ visible: true }).first();
  await expect(option).toBeVisible();
  await option.click();

  await expect(combo).toHaveAttribute("aria-expanded", "false");
  await expect(combo).toContainText(selectedText);
}

async function expectEveryVisibleComboboxOpens(page: Page) {
  const combos = page.getByRole("combobox");
  await expect(combos.first()).toBeVisible();
  const count = await combos.count();
  let visibleCount = 0;

  for (let index = 0; index < count; index += 1) {
    const combo = combos.nth(index);
    if (!(await combo.isVisible())) continue;

    visibleCount += 1;
    await expect(combo).toBeEnabled();
    await combo.click();
    await expect(combo).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByRole("option").filter({ visible: true }).first()).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(combo).toHaveAttribute("aria-expanded", "false");
  }

  expect(visibleCount).toBeGreaterThan(0);
}

function collectComboboxConsoleIssues(page: Page) {
  const consoleIssues: string[] = [];
  page.on("console", (message) => {
    const text = message.text();
    if (text.includes("React.Children.only") || text.includes("[antd: Dropdown]")) consoleIssues.push(text);
  });
  return consoleIssues;
}

test.describe("AppCombobox dropdowns", () => {
  test("usuario consegue abrir e selecionar nos comboboxes do cadastro", async ({ page }) => {
    const consoleIssues = collectComboboxConsoleIssues(page);

    await page.goto("/register");
    await page.getByRole("button", { name: /Continuar/ }).click();
    await page.getByPlaceholder("Seu nome completo").fill("Aluno Dropdown");
    await page.getByPlaceholder("seu@universidade.br").fill("dropdown.aluno@universidade.br");
    await page.getByPlaceholder(/registro/).fill("20260001");
    await page.getByPlaceholder(/8 caracteres/).fill("SenhaE2E123!");
    await page.getByPlaceholder("Repita a senha").fill("SenhaE2E123!");
    await page.getByRole("button", { name: /Continuar/ }).click();

    await expectEveryVisibleComboboxOpens(page);
    await selectComboboxOption(page, /institui.*ensino/i, /Universidade Federal do Brasil/, /Universidade Federal do Brasil/);
    await selectComboboxOption(page, /semestre atual/i, /1.*semestre/i, /1.*semestre/i);

    await expect(consoleIssues).toEqual([]);
  });

  test("aluno consegue abrir e selecionar nos comboboxes das paginas internas", async ({ page }) => {
    const consoleIssues = collectComboboxConsoleIssues(page);

    await setupApiMock(page);
    await authenticateAs(page, mockUsers.student);

    await page.goto("/app/projects");
    await page.getByRole("button", { name: /Filtros/ }).click();
    await expectEveryVisibleComboboxOpens(page);
    await selectComboboxOption(page, /Filtrar por curso/i, /Sistemas de Informacao/, /Sistemas de Informacao/);

    await page.goto("/app/progress");
    await selectComboboxOption(page, /Selecionar projeto/i, /Projeto E2E Candidatura/, /Projeto E2E Candidatura/);
    await page.getByRole("button", { name: /Nova atualiza/ }).click();
    await expectEveryVisibleComboboxOpens(page);
    await selectComboboxOption(page, /Selecionar categoria/i, /Documento/, /Documento/);
    await selectComboboxOption(page, /Selecionar etapa relacionada/i, /Proposta aprovada/, /Proposta aprovada/);

    await expect(consoleIssues).toEqual([]);
  });

  test("orientador no modo atual consegue abrir e selecionar o combobox de projeto", async ({ page }) => {
    const consoleIssues = collectComboboxConsoleIssues(page);

    await setupApiMock(page, { user: mockUsers.advisor });
    await authenticateAs(page, mockUsers.advisor);

    await page.goto("/app/progress");
    await selectComboboxOption(page, /Selecionar projeto/i, /Projeto E2E Candidatura/, /Projeto E2E Candidatura/);

    await expect(consoleIssues).toEqual([]);
  });
});
