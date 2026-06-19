export const E2E_PASSWORD = "SenhaE2E123!";

export type TestUser = {
  nome: string;
  email: string;
  senha: string;
  password: string;
  ra: string;
  token?: string;
  user?: unknown;
};

export type ProjectDraft = {
  title: string;
  description: string;
  requirements: string;
  technologies: string;
  slots: number;
};

export function unique(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function uniqueRa(): string {
  return `ra${Date.now().toString(36)}${Math.random().toString(16).slice(2, 6)}`.slice(0, 20);
}

export function buildTestUser(prefix: string, name = "Usuario E2E"): TestUser {
  const suffix = unique(prefix);

  return {
    nome: name,
    email: `${suffix}@e2e.local`,
    senha: E2E_PASSWORD,
    password: E2E_PASSWORD,
    ra: uniqueRa(),
  };
}

export function buildProjectDraft(prefix = "ic"): ProjectDraft {
  return {
    title: `Projeto E2E ${unique(prefix)}`,
    description: "Pesquisa criada por teste E2E.",
    requirements: "Python, testes automatizados",
    technologies: "React, Spring Boot, PostgreSQL",
    slots: 2,
  };
}
