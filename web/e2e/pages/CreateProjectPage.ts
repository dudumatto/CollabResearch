import { expect, type Page } from "@playwright/test";
import { expectProjectId } from "../helpers/assertions.helper";
import type { ProjectDraft } from "../helpers/test-data.helper";

export class CreateProjectPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto("/app/projects/new");
  }

  async expectVisible(): Promise<void> {
    await expect(this.page.getByRole("heading", { name: "Novo projeto" })).toBeVisible();
  }

  async fillForm(project: ProjectDraft): Promise<void> {
    await this.page.getByPlaceholder("Ex: Sistema de deteccao de anomalias com IA").fill(project.title);
    await this.page
      .getByPlaceholder("Descreva os objetivos, metodologia e resultados esperados...")
      .fill(project.description);
    await this.page.getByPlaceholder("Ex: Conhecimento em Python, estatística básica").fill(project.requirements);
    await this.page.getByPlaceholder("Ex: React, Spring Boot, PostgreSQL").fill(project.technologies);
    await this.page.locator("#areaId").selectOption({ index: 1 });
    const advisorSelect = this.page.locator("#orientadorId");
    if (await advisorSelect.isVisible()) {
      await advisorSelect.selectOption({ index: 1 });
    }
    await this.page.getByPlaceholder("Ex: 3").fill(String(project.slots));
  }

  async submit(): Promise<void> {
    await this.page.getByRole("button", { name: "Criar projeto" }).click();
  }

  async expectSuccessMessage(): Promise<void> {
    await expect(this.page.getByText("Projeto criado com sucesso! Redirecionando...")).toBeVisible();
  }

  async expectRedirectedToProjectDetail(): Promise<number> {
    await expect(this.page).toHaveURL(/\/app\/projects\/\d+$/);
    const projectId = Number(this.page.url().match(/\/projects\/(\d+)$/)?.[1]);
    expectProjectId(projectId);
    return projectId;
  }

  async createProject(project: ProjectDraft): Promise<number> {
    await this.goto();
    await this.expectVisible();
    await this.fillForm(project);
    await this.submit();
    await this.expectSuccessMessage();
    return this.expectRedirectedToProjectDetail();
  }
}
