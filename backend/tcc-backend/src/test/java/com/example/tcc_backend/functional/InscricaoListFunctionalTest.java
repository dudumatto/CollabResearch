package com.example.tcc_backend.functional;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class InscricaoListFunctionalTest extends FunctionalTestSupport {

    @Test
    void listarInscricoesDeveRetornarListaNaoVazia() throws Exception {
        TestUser orientador = registerOrientador("insc-orient");
        TestUser aluno = registerAluno("insc-aluno");

        Integer cursoId = createCurso("Computacao");
        Integer areaId = createArea("IA", cursoId);
        Integer projetoId = createProjetoAsOrientador(orientador.token(), "Projeto Teste", areaId);
        Integer inscricaoId = inscreverAluno(aluno.token(), projetoId);

        JsonNode inscricoes = objectMapper.readTree(
                mockMvc.perform(get("/api/inscricoes")
                                .header("Authorization", authHeader(orientador.token())))
                        .andExpect(status().isOk())
                        .andReturn().getResponse().getContentAsString()
        );

        assertThat(inscricoes.isArray()).isTrue();
        assertThat(inscricoes.size()).isGreaterThanOrEqualTo(1);

        boolean found = false;
        for (JsonNode i : inscricoes) {
            if (i.get("id").asInt() == inscricaoId) {
                found = true;
                assertThat(i.has("status")).isTrue();
            }
        }
        assertThat(found).isTrue();
    }

    @Test
    void buscarInscricaoPorIdDeveRetornarInscricao() throws Exception {
        TestUser orientador = registerOrientador("insc-byid");
        TestUser aluno = registerAluno("insc-byid-aluno");

        Integer cursoId = createCurso("Engenharia");
        Integer areaId = createArea("DevOps", cursoId);
        Integer projetoId = createProjetoAsOrientador(orientador.token(), "Projeto DevOps", areaId);
        Integer inscricaoId = inscreverAluno(aluno.token(), projetoId);

        JsonNode inscricao = objectMapper.readTree(
                mockMvc.perform(get("/api/inscricoes/" + inscricaoId)
                                .header("Authorization", authHeader(orientador.token())))
                        .andExpect(status().isOk())
                        .andReturn().getResponse().getContentAsString()
        );

        assertThat(inscricao.get("id").asInt()).isEqualTo(inscricaoId);
        assertThat(inscricao.has("status")).isTrue();
    }

    @Test
    void buscarInscricaoPorProjetoDeveRetornarLista() throws Exception {
        TestUser orientador = registerOrientador("insc-proj");
        TestUser aluno = registerAluno("insc-proj-aluno");

        Integer cursoId = createCurso("Redes");
        Integer areaId = createArea("Seguranca", cursoId);
        Integer projetoId = createProjetoAsOrientador(orientador.token(), "Projeto Seguranca", areaId);
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

    @Test
    void listarInscricoesSemTokenDeveRetornar401() throws Exception {
        mockMvc.perform(get("/api/inscricoes"))
                .andExpect(status().isUnauthorized());
    }
}