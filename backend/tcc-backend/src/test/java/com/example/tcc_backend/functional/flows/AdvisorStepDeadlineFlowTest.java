package com.example.tcc_backend.functional.flows;

import com.example.tcc_backend.functional.FunctionalTestSupport;
import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class AdvisorStepDeadlineFlowTest extends FunctionalTestSupport {

    @Test
    void orientadorGerenciaEtapasEAlunoConcluiEtapaDoAluno() throws Exception {
        TestUser orientador = registerOrientador("etapa-orient");
        TestUser aluno = registerAluno("etapa-aluno");

        Integer cursoId = createCurso("Sistemas de Informacao");
        Integer areaId = createArea("Engenharia de Software", cursoId);
        Integer projetoId = createProjetoAsOrientador(orientador.token(), "Projeto Etapas", areaId);

        Integer inscricaoId = inscreverAluno(aluno.token(), projetoId);
        aprovarInscricao(orientador.token(), inscricaoId);

        Map<String, Object> novaEtapa = Map.of(
                "titulo", "Documentacao final",
                "descricao", "Escrever a documentacao",
                "peso", 25,
                "responsavel", "ALUNO"
        );

        JsonNode etapaCriada = objectMapper.readTree(
                mockMvc.perform(post("/api/projetos/" + projetoId + "/etapas")
                                .header("Authorization", authHeader(orientador.token()))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(novaEtapa)))
                        .andExpect(status().isCreated())
                        .andReturn().getResponse().getContentAsString()
        );
        Integer etapaId = etapaCriada.get("id").asInt();
        assertThat(etapaCriada.get("responsavel").asText()).isEqualTo("ALUNO");
        assertThat(etapaCriada.get("status").asText()).isEqualTo("PENDING");

        mockMvc.perform(post("/api/projetos/" + projetoId + "/etapas")
                        .header("Authorization", authHeader(aluno.token()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(novaEtapa)))
                .andExpect(status().isForbidden());

        mockMvc.perform(patch("/api/projetos/" + projetoId + "/etapas/" + etapaId)
                        .header("Authorization", authHeader(orientador.token()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("status", "done"))))
                .andExpect(status().isForbidden());

        JsonNode etapaConcluida = objectMapper.readTree(
                mockMvc.perform(patch("/api/projetos/" + projetoId + "/etapas/" + etapaId)
                                .header("Authorization", authHeader(aluno.token()))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(Map.of("status", "done"))))
                        .andExpect(status().isOk())
                        .andReturn().getResponse().getContentAsString()
        );
        assertThat(etapaConcluida.get("status").asText()).isEqualTo("DONE");
        assertThat(etapaConcluida.get("concluidaPorId").asInt()).isEqualTo(aluno.userId());

        mockMvc.perform(put("/api/projetos/" + projetoId + "/etapas/" + etapaId)
                        .header("Authorization", authHeader(orientador.token()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("titulo", "Novo titulo"))))
                .andExpect(status().isConflict());
    }

    @Test
    void jobDeAlertaDePrazoExigeSecretERespeitaIdempotencia() throws Exception {
        TestUser orientador = registerOrientador("deadline-orient");
        TestUser aluno = registerAluno("deadline-aluno");

        Integer cursoId = createCurso("Ciencia da Computacao");
        Integer areaId = createArea("Inteligencia Artificial", cursoId);
        Integer projetoId = createProjetoAsOrientador(orientador.token(), "Projeto Prazo", areaId);

        Integer inscricaoId = inscreverAluno(aluno.token(), projetoId);
        aprovarInscricao(orientador.token(), inscricaoId);

        jdbc.update(
                "INSERT INTO progress_steps (project_id, title, description, weight, step_order, status, responsible, due_at, required, created_at) " +
                        "VALUES (?, ?, NULL, 10, 1, 'ACTIVE', 'ALUNO', DATEADD('DAY', 3, CURRENT_TIMESTAMP), TRUE, CURRENT_TIMESTAMP)",
                projetoId, "Etapa com prazo");

        mockMvc.perform(post("/api/internal/jobs/deadline-notifications"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/internal/jobs/deadline-notifications")
                        .header("X-Cron-Secret", "secret-errado"))
                .andExpect(status().isUnauthorized());

        JsonNode resultado = objectMapper.readTree(
                mockMvc.perform(post("/api/internal/jobs/deadline-notifications")
                                .header("X-Cron-Secret", "test-cron-secret"))
                        .andExpect(status().isOk())
                        .andReturn().getResponse().getContentAsString()
        );
        assertThat(resultado.get("notificacoesCriadas").asLong()).isEqualTo(2L);

        Long notifCount = jdbc.queryForObject(
                "SELECT COUNT(*) FROM notificacao WHERE id_usuario = ? AND tipo = 'PRAZO_PROXIMO'", Long.class, aluno.userId());
        assertThat(notifCount).isEqualTo(1L);

        JsonNode segundaExecucao = objectMapper.readTree(
                mockMvc.perform(post("/api/internal/jobs/deadline-notifications")
                                .header("X-Cron-Secret", "test-cron-secret"))
                        .andExpect(status().isOk())
                        .andReturn().getResponse().getContentAsString()
        );
        assertThat(segundaExecucao.get("notificacoesCriadas").asLong()).isZero();
        assertThat(segundaExecucao.get("duplicadosIgnorados").asLong()).isEqualTo(2L);

        Long notifCountApos = jdbc.queryForObject(
                "SELECT COUNT(*) FROM notificacao WHERE id_usuario = ? AND tipo = 'PRAZO_PROXIMO'", Long.class, aluno.userId());
        assertThat(notifCountApos).isEqualTo(1L);
    }
}
