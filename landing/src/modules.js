// Os cinco módulos da plataforma. Usado pelo átomo 3D e pelo painel de texto.
export const MODULES = [
  {
    id: "pesquisa",
    name: "Pesquisa",
    icon: "microscope",
    title: "Onde o trabalho acontece.",
    text: "Documentos, atualizações e a evolução da pesquisa ficam num só lugar. Currículo e Lattes acompanham a inscrição, sem e-mails soltos.",
    points: ["Gestão de documentos", "Atualizações do projeto", "Currículo e Lattes"],
  },
  {
    id: "equipe",
    name: "Equipe",
    icon: "users-three",
    title: "Orientador e alunos na mesma conversa.",
    text: "Candidaturas, aprovação e comunicação direta entre orientador e orientandos, com avisos em tempo real.",
    points: ["Inscrição online", "Chat com orientador", "Notificações"],
  },
  {
    id: "cronograma",
    name: "Cronograma",
    icon: "calendar-check",
    title: "Marcos, tarefas e prazos claros.",
    text: "O projeto é dividido em marcos com tarefas. O aluno marca o que concluiu e o orientador revisa: aprova ou devolve para ajustes.",
    points: ["Marcos e tarefas", "Prazos", "Revisão do orientador"],
  },
  {
    id: "resultados",
    name: "Resultados",
    icon: "chart-line-up",
    title: "Entregas e feedback estruturado.",
    text: "Entregas, avaliações e relatórios de progresso mostram a evolução de cada orientando ao longo da pesquisa.",
    points: ["Entregas", "Avaliações", "Métricas de progresso"],
  },
  {
    id: "projetos",
    name: "Projetos",
    icon: "stack",
    title: "Publicar, buscar e se candidatar.",
    text: "Orientadores publicam projetos com vagas e requisitos. Alunos buscam por área, curso ou orientador e se inscrevem online, com recomendações da Lumen.",
    points: ["Busca por área e curso", "Vagas e requisitos", "Recomendação por IA"],
  },
];
