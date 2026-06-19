import { test as base, expect } from "@playwright/test";
import { ApiHelper } from "../helpers/api.helper";
import { ApplicationsPage } from "../pages/ApplicationsPage";
import { CreateProjectPage } from "../pages/CreateProjectPage";
import { DashboardPage } from "../pages/DashboardPage";
import { DocumentsPage } from "../pages/DocumentsPage";
import { LandingPage } from "../pages/LandingPage";
import { LoginPage } from "../pages/LoginPage";
import { NotificationsPage } from "../pages/NotificationsPage";
import { ProjectDetailPage } from "../pages/ProjectDetailPage";
import { ProjectsPage } from "../pages/ProjectsPage";
import { RegisterPage } from "../pages/RegisterPage";
import { SettingsPage } from "../pages/SettingsPage";

type E2eFixtures = {
  apiHelper: ApiHelper;
  applicationsPage: ApplicationsPage;
  createProjectPage: CreateProjectPage;
  dashboardPage: DashboardPage;
  documentsPage: DocumentsPage;
  landingPage: LandingPage;
  loginPage: LoginPage;
  notificationsPage: NotificationsPage;
  projectDetailPage: ProjectDetailPage;
  projectsPage: ProjectsPage;
  registerPage: RegisterPage;
  settingsPage: SettingsPage;
};

export const test = base.extend<E2eFixtures>({
  apiHelper: async ({ request }, use) => {
    await use(new ApiHelper(request));
  },
  applicationsPage: async ({ page }, use) => {
    await use(new ApplicationsPage(page));
  },
  createProjectPage: async ({ page }, use) => {
    await use(new CreateProjectPage(page));
  },
  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },
  documentsPage: async ({ page }, use) => {
    await use(new DocumentsPage(page));
  },
  landingPage: async ({ page }, use) => {
    await use(new LandingPage(page));
  },
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  notificationsPage: async ({ page }, use) => {
    await use(new NotificationsPage(page));
  },
  projectDetailPage: async ({ page }, use) => {
    await use(new ProjectDetailPage(page));
  },
  projectsPage: async ({ page }, use) => {
    await use(new ProjectsPage(page));
  },
  registerPage: async ({ page }, use) => {
    await use(new RegisterPage(page));
  },
  settingsPage: async ({ page }, use) => {
    await use(new SettingsPage(page));
  },
});

export { expect };
