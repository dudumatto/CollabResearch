import { expect, type Page } from "@playwright/test";
import type { TestUser } from "../helpers/test-data.helper";

export class RegisterPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto("/register");
  }

  async chooseDefaultStudentType(): Promise<void> {
    await this.page.getByRole("button", { name: "Continuar" }).click();
  }

  async fillPersonalData(user: TestUser): Promise<void> {
    await this.page.getByPlaceholder("Seu nome completo").fill(user.nome);
    await this.page.getByPlaceholder("seu@universidade.br").fill(user.email);
    await this.page.getByPlaceholder("Seu registro acadêmico").fill(user.ra);
    await this.page.getByPlaceholder("Minimo 8 caracteres").fill(user.senha);
    await this.page.getByPlaceholder("Repita a senha").fill(user.senha);
  }

  async continueToAcademicData(): Promise<void> {
    await this.page.getByRole("button", { name: "Continuar" }).click();
  }

  async fillAcademicData(): Promise<void> {
    await this.page.locator("select").first().selectOption({ index: 1 });
    await this.page.locator("select").nth(1).selectOption({ index: 1 });
    await this.page.locator("select").nth(2).selectOption({ index: 1 });
  }

  async acceptTerms(): Promise<void> {
    await this.page.locator("#terms").check();
  }

  async submit(): Promise<void> {
    await this.page.getByRole("button", { name: "Criar conta" }).click();
    await expect(this.page).toHaveURL(/\/app$/);
  }

  async registerStudent(user: TestUser): Promise<void> {
    await this.goto();
    await this.chooseDefaultStudentType();
    await this.fillPersonalData(user);
    await this.continueToAcademicData();
    await this.fillAcademicData();
    await this.acceptTerms();
    await this.submit();
  }
}
