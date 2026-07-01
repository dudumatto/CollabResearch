package com.example.tcc_backend.functional.flows;

import com.example.tcc_backend.functional.FunctionalTestSupport;
import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class AdvisorProjectManagementFlowTest extends FunctionalTestSupport {

    @Test
    void orientadorGerenciaInscricoesDoProjeto() throws Exception {
        TestUser orientador = registerOrientador("advisor-orient");
        TestUser aluno = registerAluno("advisor-aluno");
        TestUser outroAluno = registerAluno("advisor-outro");

        Integer cursoId = createCurso("Engenharia de Software");
        Integer areaId = createArea("DevOps", cursoId);

        Integer projetoId = createProjetoAsOrientador(orientador.token(), "Projeto DevOps", areaId);

        Integer inscricaoId = inscreverAluno(aluno.token(), projetoId);
        Integer inscricaoOutroId = inscreverAluno(outroAluno.token(), projetoId);

        JsonNode inscricoesJson = objectMapper.readTree(
                mockMvc.perform(get("/api/inscricoes/projeto/" + projetoId)
                                .header("Authorization", authHeader(orientador.token())))
                        .andExpect(status().isOk())
                        .andReturn().getResponse().getContentAsString()
        );
        assertThat(inscricoesJson.size()).isEqualTo(2);

        aprovarInscricao(orientador.token(), inscricaoId);

        String statusAprovada = jdbc.queryForObject(
                "SELECT status FROM inscricao WHERE id_inscricao = ?", String.class, inscricaoId);
        assertThat(statusAprovada).isEqualTo("APROVADO");

        Long notifCount = jdbc.queryForObject(
                "SELECT COUNT(*) FROM notificacao WHERE id_usuario = ?", Long.class, aluno.userId());
        assertThat(notifCount).isGreaterThanOrEqualTo(1);

        mockMvc.perform(put("/api/inscricoes/" + inscricaoOutroId + "/aprovar")
                        .header("Authorization", authHeader(aluno.token()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("parecerOrientador", "Tentativa"))))
                .andExpect(status().isForbidden());
    }
}