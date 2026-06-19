import { expect, type Page } from "@playwright/test";

export class ProjectsPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto("/app/projects");
  }

  async searchProject(title: string): Promise<void> {
    await this.page.getByPlaceholder("Buscar projetos por titulo, area ou tecnologia...").fill(title);
  }

  async expectProjectVisible(title: string): Promise<void> {
    await expect(this.page.getByText(title)).toBeVisible();
  }

  async openFilters(): Promise<void> {
    await this.page.getByRole("button", { name: "Filtros" }).click();
  }

  async expectFiltersVisible(): Promise<void> {
    await expect(this.page.getByText("Area de pesquisa")).toBeVisible();
    await expect(this.page.locator("select.pagina-projetos__input-filtro-curso")).toBeVisible();
  }
}
