import { expect, type Page } from "@playwright/test";
import { expectToastSuccess } from "../helpers/assertions.helper";

export class ProjectDetailPage {
  constructor(private readonly page: Page) {}

  async goto(projectId: number): Promise<void> {
    await this.page.goto(`/app/projects/${projectId}`);
  }

  async expectProjectVisible(title: string): Promise<void> {
    await expect(this.page.getByRole("heading", { name: title })).toBeVisible();
  }

  async expectOwnerSectionsVisible(): Promise<void> {
    await expect(this.page.getByText("Sobre o projeto")).toBeVisible();
    await expect(this.page.getByText("Colaboradores")).toBeVisible();
  }

  async openApplicationForm(): Promise<void> {
    await this.page.getByRole("button", { name: "Inscrever-se" }).click();
    await expect(this.page.getByText("Inscricao no projeto")).toBeVisible();
  }

  async fillApplication(motivation: string): Promise<void> {
    await this.page.getByPlaceholder("Escreva sua motivação para o projeto...").fill(motivation);
  }

  async submitApplication(): Promise<void> {
    await this.page.getByRole("button", { name: "Enviar inscrição" }).click();
  }

  async expectApplicationSuccess(): Promise<void> {
    await expectToastSuccess(this.page, "Inscricao enviada com sucesso.");
  }

  async apply(motivation: string): Promise<void> {
    await this.openApplicationForm();
    await this.fillApplication(motivation);
    await this.submitApplication();
    await this.expectApplicationSuccess();
  }
}
