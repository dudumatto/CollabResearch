package com.example.tcc_backend.functional;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class ProgressoFunctionalTest extends FunctionalTestSupport {

    @Test
    void criarProgressoDeveRetornar201() throws Exception {
        TestUser orientador = registerOrientador("prog-create");
        TestUser aluno = registerAluno("prog-create-aluno");
        Integer areaId = createArea("IA", createCurso("CC"));
        Integer projetoId = createProjetoAsOrientador(orientador.token(), "Projeto Progresso", areaId);
        Integer inscricaoId = inscreverAluno(aluno.token(), projetoId);
        aprovarInscricao(orientador.token(), inscricaoId);

        Integer progressoId = criarProgresso(aluno.token(), projetoId, "Etapa 1");
        assertThat(progressoId).isNotNull();
    }

    @Test
    void listarProgressoPorProjetoDeveRetornarLista() throws Exception {
        TestUser orientador = registerOrientador("prog-list");
        TestUser aluno = registerAluno("prog-list-aluno");
        Integer areaId = createArea("IA", createCurso("CC"));
        Integer projetoId = createProjetoAsOrientador(orientador.token(), "Projeto Lista Progresso", areaId);
        Integer inscricaoId = inscreverAluno(aluno.token(), projetoId);
        aprovarInscricao(orientador.token(), inscricaoId);
        criarProgresso(aluno.token(), projetoId, "Atualizacao");

        JsonNode progressos = objectMapper.readTree(
                mockMvc.perform(get("/api/projetos/" + projetoId + "/progresso")
                                .header("Authorization", authHeader(aluno.token())))
                        .andExpect(status().isOk())
                        .andReturn().getResponse().getContentAsString()
        );
        assertThat(progressos.isArray()).isTrue();
        assertThat(progressos.size()).isGreaterThanOrEqualTo(1);
    }

    @Test
    void atualizarProgressoDeveFuncionar() throws Exception {
        TestUser orientador = registerOrientador("prog-update");
        TestUser aluno = registerAluno("prog-update-aluno");
        Integer areaId = createArea("IA", createCurso("CC"));
        Integer projetoId = createProjetoAsOrientador(orientador.token(), "Projeto Update Progresso", areaId);
        Integer inscricaoId = inscreverAluno(aluno.token(), projetoId);
        aprovarInscricao(orientador.token(), inscricaoId);
        Integer progressoId = criarProgresso(aluno.token(), projetoId, "Original");

        mockMvc.perform(put("/api/progresso/" + progressoId)
                        .header("Authorization", authHeader(aluno.token()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "titulo", "Atualizado",
                                "descricao", "Nova descricao",
                                "tipo", "ATUALIZACAO"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.titulo").value("Atualizado"));
    }

    @Test
    void removerProgressoDeveRetornar204() throws Exception {
        TestUser orientador = registerOrientador("prog-delete");
        TestUser aluno = registerAluno("prog-delete-aluno");
        Integer areaId = createArea("IA", createCurso("CC"));
        Integer projetoId = createProjetoAsOrientador(orientador.token(), "Projeto Delete Progresso", areaId);
        Integer inscricaoId = inscreverAluno(aluno.token(), projetoId);
        aprovarInscricao(orientador.token(), inscricaoId);
        Integer progressoId = criarProgresso(aluno.token(), projetoId, "Para deletar");

        mockMvc.perform(delete("/api/progresso/" + progressoId)
                        .header("Authorization", authHeader(aluno.token())))
                .andExpect(status().isNoContent());
    }
}
