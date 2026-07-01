package com.example.tcc_backend.functional;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class FeedbackFunctionalTest extends FunctionalTestSupport {

    @Test
    void criarFeedbackDeveRetornar201() throws Exception {
        TestUser orientador = registerOrientador("fb-create");
        TestUser aluno = registerAluno("fb-create-aluno");
        Integer areaId = createArea("IA", createCurso("CC"));
        Integer projetoId = createProjetoAsOrientador(orientador.token(), "Projeto Feedback", areaId);
        Integer inscricaoId = inscreverAluno(aluno.token(), projetoId);
        aprovarInscricao(orientador.token(), inscricaoId);

        mockMvc.perform(post("/api/feedback")
                        .header("Authorization", authHeader(aluno.token()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "projetoId", projetoId,
                                "nota", 5,
                                "comentario", "Muito bom"
                        ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.nota").value(5));
    }

    @Test
    void listarFeedbacksPorProjetoDeveRetornarLista() throws Exception {
        TestUser orientador = registerOrientador("fb-list");
        TestUser aluno = registerAluno("fb-list-aluno");
        Integer areaId = createArea("IA", createCurso("CC"));
        Integer projetoId = createProjetoAsOrientador(orientador.token(), "Projeto Lista Feedback", areaId);
        Integer inscricaoId = inscreverAluno(aluno.token(), projetoId);
        aprovarInscricao(orientador.token(), inscricaoId);

        mockMvc.perform(post("/api/feedback")
                        .header("Authorization", authHeader(aluno.token()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "projetoId", projetoId,
                                "nota", 4,
                                "comentario", "Bom"
                        ))))
                .andExpect(status().isCreated());

        JsonNode feedbacks = objectMapper.readTree(
                mockMvc.perform(get("/api/feedback/projeto/" + projetoId)
                                .header("Authorization", authHeader(orientador.token())))
                        .andExpect(status().isOk())
                        .andReturn().getResponse().getContentAsString()
        );
        assertThat(feedbacks.isArray()).isTrue();
        assertThat(feedbacks.size()).isGreaterThanOrEqualTo(1);
    }

    @Test
    void listarFeedbacksPorOrientadorDeveRetornarLista() throws Exception {
        TestUser orientador = registerOrientador("fb-user");
        TestUser aluno = registerAluno("fb-user-aluno");
        Integer areaId = createArea("IA", createCurso("CC"));
        Integer projetoId = createProjetoAsOrientador(orientador.token(), "Projeto Feedback Usuario", areaId);
        Integer inscricaoId = inscreverAluno(aluno.token(), projetoId);
        aprovarInscricao(orientador.token(), inscricaoId);

        mockMvc.perform(post("/api/feedback")
                        .header("Authorization", authHeader(aluno.token()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "projetoId", projetoId,
                                "nota", 3,
                                "comentario", "Regular"
                        ))))
                .andExpect(status().isCreated());

        JsonNode feedbacks = objectMapper.readTree(
                mockMvc.perform(get("/api/feedback/usuario/" + orientador.userId())
                                .header("Authorization", authHeader(orientador.token())))
                        .andExpect(status().isOk())
                        .andReturn().getResponse().getContentAsString()
        );
        assertThat(feedbacks.isArray()).isTrue();
        assertThat(feedbacks.size()).isGreaterThanOrEqualTo(1);
    }
}
