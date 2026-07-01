package com.example.tcc_backend.functional;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class InscricaoFunctionalTest extends FunctionalTestSupport {

    @Test
    void criarInscricaoDeveRetornar201() throws Exception {
        TestUser orientador = registerOrientador("insc-create");
        TestUser aluno = registerAluno("insc-create-aluno");
        Integer areaId = createArea("IA", createCurso("CC"));
        Integer projetoId = createProjetoAsOrientador(orientador.token(), "Projeto Inscrição", areaId);

        Integer inscricaoId = inscreverAluno(aluno.token(), projetoId);
        assertThat(inscricaoId).isNotNull();
    }

    @Test
    void listarInscricoesDeveRetornarLista() throws Exception {
        TestUser orientador = registerOrientador("insc-list");
        TestUser aluno = registerAluno("insc-list-aluno");
        Integer areaId = createArea("IA", createCurso("CC"));
        Integer projetoId = createProjetoAsOrientador(orientador.token(), "Projeto Lista", areaId);
        inscreverAluno(aluno.token(), projetoId);

        JsonNode inscricoes = objectMapper.readTree(
                mockMvc.perform(get("/api/inscricoes")
                                .header("Authorization", authHeader(orientador.token())))
                        .andExpect(status().isOk())
                        .andReturn().getResponse().getContentAsString()
        );
        assertThat(inscricoes.isArray()).isTrue();
        assertThat(inscricoes.size()).isGreaterThanOrEqualTo(1);
    }

    @Test
    void buscarInscricaoPorIdDeveRetornarInscricao() throws Exception {
        TestUser orientador = registerOrientador("insc-byid");
        TestUser aluno = registerAluno("insc-byid-aluno");
        Integer areaId = createArea("IA", createCurso("CC"));
        Integer projetoId = createProjetoAsOrientador(orientador.token(), "Projeto Busca", areaId);
        Integer inscricaoId = inscreverAluno(aluno.token(), projetoId);

        JsonNode inscricao = objectMapper.readTree(
                mockMvc.perform(get("/api/inscricoes/" + inscricaoId)
                                .header("Authorization", authHeader(orientador.token())))
                        .andExpect(status().isOk())
                        .andReturn().getResponse().getContentAsString()
        );
        assertThat(inscricao.get("id").asInt()).isEqualTo(inscricaoId);
    }

    @Test
    void aprovarInscricaoDeveMudarStatus() throws Exception {
        TestUser orientador = registerOrientador("insc-approve");
        TestUser aluno = registerAluno("insc-approve-aluno");
        Integer areaId = createArea("IA", createCurso("CC"));
        Integer projetoId = createProjetoAsOrientador(orientador.token(), "Projeto Aprovar", areaId);
        Integer inscricaoId = inscreverAluno(aluno.token(), projetoId);

        mockMvc.perform(put("/api/inscricoes/" + inscricaoId + "/aprovar")
                        .header("Authorization", authHeader(orientador.token()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("parecerOrientador", "Aprovado"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APROVADO"));
    }

    @Test
    void rejeitarInscricaoDeveMudarStatus() throws Exception {
        TestUser orientador = registerOrientador("insc-reject");
        TestUser aluno = registerAluno("insc-reject-aluno");
        Integer areaId = createArea("IA", createCurso("CC"));
        Integer projetoId = createProjetoAsOrientador(orientador.token(), "Projeto Rejeitar", areaId);
        Integer inscricaoId = inscreverAluno(aluno.token(), projetoId);

        mockMvc.perform(put("/api/inscricoes/" + inscricaoId + "/rejeitar")
                        .header("Authorization", authHeader(orientador.token()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("parecerOrientador", "Rejeitado"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REJEITADO"));
    }

    @Test
    void cancelarInscricaoDeveRetornar204() throws Exception {
        TestUser orientador = registerOrientador("insc-cancel");
        TestUser aluno = registerAluno("insc-cancel-aluno");
        Integer areaId = createArea("IA", createCurso("CC"));
        Integer projetoId = createProjetoAsOrientador(orientador.token(), "Projeto Cancelar", areaId);
        Integer inscricaoId = inscreverAluno(aluno.token(), projetoId);

        mockMvc.perform(delete("/api/inscricoes/" + inscricaoId)
                        .header("Authorization", authHeader(aluno.token())))
                .andExpect(status().isNoContent());
    }

    @Test
    void criarInscricaoComBodyInvalidoDeveRetornar400() throws Exception {
        TestUser aluno = registerAluno("insc-invalid");

        mockMvc.perform(post("/api/inscricoes")
                        .header("Authorization", authHeader(aluno.token()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void listarInscricoesPorProjetoDeveRetornarLista() throws Exception {
        TestUser orientador = registerOrientador("insc-proj");
        TestUser aluno = registerAluno("insc-proj-aluno");
        Integer areaId = createArea("IA", createCurso("CC"));
        Integer projetoId = createProjetoAsOrientador(orientador.token(), "Projeto Por Projeto", areaId);
        inscreverAluno(aluno.token(), projetoId);

        JsonNode inscricoes = objectMapper.readTree(
                mockMvc.perform(get("/api/inscricoes/projeto/" + projetoId)
                                .header("Authorization", authHeader(orientador.token())))
                        .andExpect(status().isOk())
                        .andReturn().getResponse().getContentAsString()
        );
        assertThat(inscricoes.isArray()).isTrue();
        assertThat(inscricoes.size()).isGreaterThanOrEqualTo(1);
    }
}
