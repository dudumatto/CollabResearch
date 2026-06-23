export function getAlunoCredentials() {
  return {
    email: process.env.E2E_ALUNO_EMAIL!,
    password: process.env.E2E_ALUNO_PASSWORD!,
  }
}

export function getProfessorCredentials() {
  return {
    email: process.env.E2E_PROFESSOR_EMAIL!,
    password: process.env.E2E_PROFESSOR_PASSWORD!,
  }
}

export function getAdminCredentials() {
  return {
    email: process.env.E2E_ADMIN_EMAIL!,
    password: process.env.E2E_ADMIN_PASSWORD!,
  }
}