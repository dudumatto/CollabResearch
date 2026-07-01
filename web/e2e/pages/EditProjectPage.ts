import { expect, type Page } from "@playwright/test";

export class EditProjectPage {
  constructor(private readonly page: Page) {}

  async goto(projectId: number): Promise<void> {
    await this.page.goto(`/app/projects/${projectId}/edit`);
  }

  async expectVisible(): Promise<void> {
    await expect(this.page.getByRole("heading", { name: "Editar projeto" })).toBeVisible();
  }

  async fillTitle(title: string): Promise<void> {
    await this.page.locator("#titulo").fill(title);
  }

  async fillDescription(description: string): Promise<void> {
    await this.page.locator("#descricao").fill(description);
  }

  async submit(): Promise<void> {
    await this.page.getByRole("button", { name: "Salvar alterações" }).click();
  }

  async expectSuccessMessage(): Promise<void> {
    await expect(this.page.getByText("Projeto atualizado! Redirecionando...")).toBeVisible();
  }

  async expectRedirectedToDetail(projectId: number): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(`/app/projects/${projectId}$`));
  }

  async expectValidationError(): Promise<void> {
    await expect(this.page.locator(".formulario-projeto__alerta--erro")).toBeVisible();
  }

  async cancel(): Promise<void> {
    await this.page.getByRole("button", { name: "Cancelar" }).click();
  }
}
