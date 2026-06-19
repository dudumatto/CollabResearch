export const AREAS_ESTUDO = [
  "Ciência da Computação",
  "Engenharia de Computação",
  "Sistemas de Informação",
  "Licenciatura em Computação",
  "Engenharia Elétrica",
];

export const CURSOS = [
  "Ciência da Computação",
  "Engenharia de Computação",
  "Sistemas de Informação",
  "Licenciatura em Computação",
  "Engenharia Elétrica",
];

export const AREAS_ESTUDO_OPTIONS = AREAS_ESTUDO.map((nome, index) => ({
  id: index + 1,
  nome,
}));

export const STATUS_PROJETO = {
  ABERTO: "ABERTO",
  EM_ANDAMENTO: "EM_ANDAMENTO",
  FINALIZADO: "FINALIZADO",
};
