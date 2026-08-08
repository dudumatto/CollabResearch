package com.example.tcc_backend.functional;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class OrientadorFunctionalTest extends FunctionalTestSupport {

    private Integer orientadorIdOrientador(Integer usuarioId) {
        return jdbc.queryForObject(
                "SELECT id_orientador FROM orientador WHERE id_usuario = ?", Integer.class, usuarioId);
    }

    private Integer alunoIdAluno(Integer usuarioId) {
        return jdbc.queryForObject(
                "SELECT id_aluno FROM aluno WHERE id_usuario = ?", Integer.class, usuarioId);
    }

    private Integer primeiraEtapaPendente(Integer projetoId) {
        return jdbc.queryForObject(
                "SELECT id FROM progress_steps WHERE project_id = ? AND status <> 'DONE' ORDER BY step_order LIMIT 1",
                Integer.class, projetoId);
    }

    @Test
    void dashboardDeveRetornarMetricasDoOrientador() throws Exception {
        TestUser orientador = registerOrientador("dash-metric");
        TestUser aluno = registerAluno("dash-metric");

        Integer cursoId = createCurso("Ciencia da Computacao");
        Integer areaId = createArea("IA", cursoId);

        Integer projetoId = createProjetoAsOrientador(orientador.token(), "Projeto IA", areaId);
        Integer inscricaoId = inscreverAluno(aluno.token(), projetoId);
        aprovarInscricao(orientador.token(), inscricaoId);

        mockMvc.perform(patch("/api/projetos/" + projetoId + "/status")
                        .header("Authorization", authHeader(orientador.token()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("status", "EM_ANDAMENTO"))))
                .andExpect(status().isOk());

        Integer stepId = primeiraEtapaPendente(projetoId);
        jdbc.update("UPDATE progress_steps SET due_at = DATEADD('DAY', -2, CURRENT_TIMESTAMP) WHERE id = ?", stepId);

        jdbc.update("INSERT INTO project_deliveries (project_id, author_user_id, title, category, status) VALUES (?, ?, ?, ?, ?)",
                projetoId, aluno.userId(), "Monografia", "documento", "PENDING_REVIEW");
        jdbc.update("INSERT INTO academic_evaluations (project_id, step_id, student_id, advisor_id, participation, technical_quality, deadline_compliance, communication, advisor_comment, average_score) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                projetoId, stepId, alunoIdAluno(aluno.userId()), orientadorIdOrientador(orientador.userId()),
                4, 4, 4, 4, "Bom desempenho", 4.00);

        JsonNode dashboard = objectMapper.readTree(
                mockMvc.perform(get("/api/orientador/dashboard")
                                .header("Authorization", authHeader(orientador.token())))
                        .andExpect(status().isOk())
                        .andReturn().getResponse().getContentAsString()
        );

        JsonNode metricas = dashboard.get("metricas");
        assertThat(metricas.get("projetosAtivos").asLong()).isEqualTo(1);
        assertThat(metricas.get("solicitacoesOrientacao").asLong()).isZero();
        assertThat(metricas.get("inscricoesPendentes").asLong()).isZero();
        assertThat(metricas.get("orientandosAtivos").asLong()).isEqualTo(1);
        assertThat(metricas.get("etapasAtrasadas").asLong()).isEqualTo(1);
        assertThat(metricas.get("entregasAguardandoRevisao").asLong()).isEqualTo(1);
        assertThat(metricas.get("avaliacoesAguardandoCiencia").asLong()).isEqualTo(1);

        JsonNode filas = dashboard.get("filas");
        assertThat(filas.get("etapasAtrasadas").size()).isEqualTo(1);
        assertThat(filas.get("etapasAtrasadas").get(0).get("destino").asText())
                .isEqualTo("/app/projects/" + projetoId);
        assertThat(filas.get("entregasAguardandoRevisao").size()).isEqualTo(1);
        assertThat(filas.get("avaliacoesAguardandoCiencia").size()).isEqualTo(1);
    }

    @Test
    void filasDevemSerLimitadasACincoItens() throws Exception {
        TestUser orientador = registerOrientador("dash-limit");
        Integer cursoId = createCurso("Engenharia");
        Integer areaId = createArea("DevOps", cursoId);
        Integer projetoId = createProjetoAsOrientador(orientador.token(), "Projeto Vagas", areaId);

        for (int i = 0; i < 6; i++) {
            TestUser candidato = registerAluno("candidato-" + i);
            inscreverAluno(candidato.token(), projetoId);
        }

        JsonNode dashboard = objectMapper.readTree(
                mockMvc.perform(get("/api/orientador/dashboard")
                                .header("Authorization", authHeader(orientador.token())))
                        .andExpect(status().isOk())
                        .andReturn().getResponse().getContentAsString()
        );

        assertThat(dashboard.get("metricas").get("inscricoesPendentes").asLong()).isEqualTo(6);
        assertThat(dashboard.get("filas").get("inscricoesPendentes").size()).isEqualTo(5);
    }

    @Test
    void orientandosDevemDeduplicarAlunoEmVariosProjetos() throws Exception {
        TestUser orientador = registerOrientador("dedup");
        TestUser aluno = registerAluno("dedup");

        Integer cursoId = createCurso("Sistemas");
        Integer areaId = createArea("Web", cursoId);

        Integer projeto1 = createProjetoAsOrientador(orientador.token(), "Projeto Um", areaId);
        Integer projeto2 = createProjetoAsOrientador(orientador.token(), "Projeto Dois", areaId);
        aprovarInscricao(orientador.token(), inscreverAluno(aluno.token(), projeto1));
        aprovarInscricao(orientador.token(), inscreverAluno(aluno.token(), projeto2));

        JsonNode orientandos = objectMapper.readTree(
                mockMvc.perform(get("/api/orientador/orientandos")
                                .header("Authorization", authHeader(orientador.token())))
                        .andExpect(status().isOk())
                        .andReturn().getResponse().getContentAsString()
        );

        assertThat(orientandos.size()).isEqualTo(1);
        assertThat(orientandos.get(0).get("projetos").size()).isEqualTo(2);
        assertThat(orientandos.get(0).get("alunoUsuarioId").asInt()).isEqualTo(aluno.userId());
    }

    @Test
    void orientandosDevemFiltrarPorBuscaEProjeto() throws Exception {
        TestUser orientador = registerOrientador("busca");
        TestUser alunoA = registerAluno("busca-a");
        TestUser alunoB = registerAluno("busca-b");

        Integer cursoId = createCurso("Dados");
        Integer areaId = createArea("BD", cursoId);
        Integer projetoId = createProjetoAsOrientador(orientador.token(), "Projeto Base", areaId);
        aprovarInscricao(orientador.token(), inscreverAluno(alunoA.token(), projetoId));
        aprovarInscricao(orientador.token(), inscreverAluno(alunoB.token(), projetoId));

        String token = orientador.token();

        JsonNode porBusca = objectMapper.readTree(
                mockMvc.perform(get("/api/orientador/orientandos")
                                .param("busca", "Aluno busca-b")
                                .header("Authorization", authHeader(token)))
                        .andExpect(status().isOk())
                        .andReturn().getResponse().getContentAsString());
        assertThat(porBusca.size()).isEqualTo(1);
        assertThat(porBusca.get(0).get("alunoUsuarioId").asInt()).isEqualTo(alunoB.userId());

        JsonNode porProjeto = objectMapper.readTree(
                mockMvc.perform(get("/api/orientador/orientandos")
                                .param("projetoId", String.valueOf(projetoId))
                                .header("Authorization", authHeader(token)))
                        .andExpect(status().isOk())
                        .andReturn().getResponse().getContentAsString());
        assertThat(porProjeto.size()).isEqualTo(2);
    }

    @Test
    void detalheOrientandoDeveRetornarEtapasEPrazos() throws Exception {
        TestUser orientador = registerOrientador("detalhe");
        TestUser aluno = registerAluno("detalhe");

        Integer cursoId = createCurso("Redes");
        Integer areaId = createArea("Seguranca", cursoId);
        Integer projetoId = createProjetoAsOrientador(orientador.token(), "Projeto Detalhe", areaId);
        aprovarInscricao(orientador.token(), inscreverAluno(aluno.token(), projetoId));

        Integer alunoId = alunoIdAluno(aluno.userId());

        JsonNode detalhe = objectMapper.readTree(
                mockMvc.perform(get("/api/orientador/orientandos/" + alunoId)
                                .param("projectId", String.valueOf(projetoId))
                                .header("Authorization", authHeader(orientador.token())))
                        .andExpect(status().isOk())
                        .andReturn().getResponse().getContentAsString()
        );

        assertThat(detalhe.get("projetoSelecionado").get("projetoId").asInt()).isEqualTo(projetoId);
        assertThat(detalhe.get("etapas").size()).isEqualTo(6);
        assertThat(detalhe.get("etapas").get(0).has("prazo")).isTrue();
        assertThat(detalhe.get("etapas").get(0).has("responsavel")).isTrue();
        assertThat(detalhe.get("historico")).isNotNull();
    }

    @Test
    void inscricoesDevemRetornarEChamarPorStatus() throws Exception {
        TestUser orientador = registerOrientador("insc");
        TestUser aluno = registerAluno("insc");

        Integer cursoId = createCurso("Computacao");
        Integer areaId = createArea("Backend", cursoId);
        Integer projetoId = createProjetoAsOrientador(orientador.token(), "Projeto Inscricoes", areaId);
        inscreverAluno(aluno.token(), projetoId);

        String token = orientador.token();

        JsonNode todas = objectMapper.readTree(
                mockMvc.perform(get("/api/orientador/inscricoes")
                                .header("Authorization", authHeader(token)))
                        .andExpect(status().isOk())
                        .andReturn().getResponse().getContentAsString());
        assertThat(todas.size()).isEqualTo(1);
        assertThat(todas.get(0).get("status").asText()).isEqualTo("PENDENTE");

        JsonNode pendentes = objectMapper.readTree(
                mockMvc.perform(get("/api/orientador/inscricoes")
                                .param("status", "PENDENTE")
                                .header("Authorization", authHeader(token)))
                        .andExpect(status().isOk())
                        .andReturn().getResponse().getContentAsString());
        assertThat(pendentes.size()).isEqualTo(1);

        mockMvc.perform(get("/api/orientador/inscricoes")
                        .param("status", "INVALIDO")
                        .header("Authorization", authHeader(token)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void alunoRecebe403NaAreaDoOrientador() throws Exception {
        TestUser aluno = registerAluno("bloqueado");

        mockMvc.perform(get("/api/orientador/dashboard")
                        .header("Authorization", authHeader(aluno.token())))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/orientador/inscricoes")
                        .header("Authorization", authHeader(aluno.token())))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/orientador/orientandos")
                        .header("Authorization", authHeader(aluno.token())))
                .andExpect(status().isForbidden());
    }

    @Test
    void orientadorNaoVazaOrientandosDeOutroOrientador() throws Exception {
        TestUser orientadorA = registerOrientador("vaz-a");
        TestUser orientadorB = registerOrientador("vaz-b");
        TestUser aluno = registerAluno("vaz-aluno");

        Integer cursoId = createCurso("Jogos");
        Integer areaId = createArea("Games", cursoId);
        Integer projetoId = createProjetoAsOrientador(orientadorA.token(), "Projeto do A", areaId);
        aprovarInscricao(orientadorA.token(), inscreverAluno(aluno.token(), projetoId));

        Integer alunoId = alunoIdAluno(aluno.userId());

        JsonNode orientandosB = objectMapper.readTree(
                mockMvc.perform(get("/api/orientador/orientandos")
                                .header("Authorization", authHeader(orientadorB.token())))
                        .andExpect(status().isOk())
                        .andReturn().getResponse().getContentAsString());
        assertThat(orientandosB.size()).isZero();

        MvcResult resultado = mockMvc.perform(get("/api/orientador/orientandos/" + alunoId)
                        .param("projectId", String.valueOf(projetoId))
                        .header("Authorization", authHeader(orientadorB.token())))
                .andReturn();
        assertThat(resultado.getResponse().getStatus()).isIn(403, 404);
    }

    @Test
    void adminPodeAuditarDashboard() throws Exception {
        TestUser orientador = registerOrientador("audit-adv");
        TestUser admin = createAdminAndLogin();

        Integer cursoId = createCurso("Autos");
        Integer areaId = createArea("IA", cursoId);
        createProjetoAsOrientador(orientador.token(), "Projeto Auditado", areaId);

        JsonNode dashboard = objectMapper.readTree(
                mockMvc.perform(get("/api/orientador/dashboard")
                                .header("Authorization", authHeader(admin.token())))
                        .andExpect(status().isOk())
                        .andReturn().getResponse().getContentAsString()
        );

        assertThat(dashboard.get("metricas").get("projetosAtivos").asLong()).isEqualTo(1);
    }

    @Test
    void endpointsSemTokenDevemRetornar401() throws Exception {
        mockMvc.perform(get("/api/orientador/dashboard")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/orientador/inscricoes")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/orientador/orientandos")).andExpect(status().isUnauthorized());
    }
}
