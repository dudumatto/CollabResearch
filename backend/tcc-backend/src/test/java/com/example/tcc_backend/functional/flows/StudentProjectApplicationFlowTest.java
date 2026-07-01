package com.example.tcc_backend.functional.flows;

import com.example.tcc_backend.functional.FunctionalTestSupport;
import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class StudentProjectApplicationFlowTest extends FunctionalTestSupport {

    @Test
    void fluxoCompletoAlunoSeInscreveEmProjetoDoOrientador() throws Exception {
        TestUser orientador = registerOrientador("flow-orient");
        TestUser aluno = registerAluno("flow-aluno");

        Integer cursoId = createCurso("Ciencia da Computacao");
        Integer areaId = createArea("Inteligencia Artificial", cursoId);

        Integer projetoId = createProjetoAsOrientador(
                orientador.token(),
                "Projeto de IA para Diagnostico Medical",
                areaId
        );

        JsonNode projetoJson = objectMapper.readTree(
                mockMvc.perform(get("/api/projetos/" + projetoId)
                                .header("Authorization", authHeader(aluno.token())))
                        .andExpect(status().isOk())
                        .andReturn().getResponse().getContentAsString()
        );
        assertThat(projetoJson.get("id").asInt()).isEqualTo(projetoId);
        assertThat(projetoJson.get("titulo").asText()).contains("IA");
        assertThat(projetoJson.get("status").asText()).isEqualTo("ABERTO");

        Integer inscricaoId = inscreverAluno(aluno.token(), projetoId);

        Integer inscricoesCount = jdbc.queryForObject(
                "SELECT COUNT(*) FROM inscricao WHERE id_projeto = ?",
                Integer.class, projetoId
        );
        assertThat(inscricoesCount).isEqualTo(1);

        JsonNode inscricoesJson = objectMapper.readTree(
                mockMvc.perform(get("/api/inscricoes/projeto/" + projetoId)
                                .header("Authorization", authHeader(orientador.token())))
                        .andExpect(status().isOk())
                        .andReturn().getResponse().getContentAsString()
        );
        assertThat(inscricoesJson.size()).isEqualTo(1);
        assertThat(inscricoesJson.get(0).get("status").asText()).isEqualTo("PENDENTE");

        aprovarInscricao(orientador.token(), inscricaoId);

        String statusAfter = jdbc.queryForObject(
                "SELECT status FROM inscricao WHERE id_inscricao = ?",
                String.class, inscricaoId
        );
        assertThat(statusAfter).isEqualTo("APROVADO");

        Long notificacoesCount = jdbc.queryForObject(
                "SELECT COUNT(*) FROM notificacao WHERE id_usuario = ?",
                Long.class, aluno.userId()
        );
        assertThat(notificacoesCount).isGreaterThanOrEqualTo(1);
    }
}