import { buildTestUser } from "../helpers/test-data.helper";

export function buildLoginCandidate() {
  return buildTestUser("login-flow", "Usuario Login E2E");
}

export function buildRegisterCandidate() {
  return buildTestUser("register-flow", "Usuario Cadastro E2E");
}
