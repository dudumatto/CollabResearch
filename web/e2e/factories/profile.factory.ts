import { unique } from "../helpers/test-data.helper";

export function buildProfileUpdate() {
  return {
    nome: `Usuario Perfil ${unique("perfil")}`.slice(0, 60),
    curso: "Ciencia da Computacao",
    instituicao: "Instituto E2E",
    semestre: "8",
    bio: `Bio atualizada via E2E ${unique("bio")}`.slice(0, 120),
  };
}
