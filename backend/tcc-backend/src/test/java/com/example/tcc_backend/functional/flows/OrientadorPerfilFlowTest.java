package com.example.tcc_backend.functional.flows;

import com.example.tcc_backend.functional.FunctionalTestSupport;
import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class OrientadorPerfilFlowTest extends FunctionalTestSupport {

    @Test
    void perfilDeveRetornarContadoresEAtualizarDados() throws Exception {
        TestUser orientador = registerOrientador("perfil-orient");
        TestUser aluno = registerAluno("perfil-aluno");

        Integer cursoId = createCurso("Ciencia de Dados");
        Integer areaId = createArea("ML", cursoId);
        Integer projetoId = createProjetoAsOrientador(orientador.token(), "Projeto Perfil", areaId);

        Integer inscricaoId = inscreverAluno(aluno.token(), projetoId);
        aprovarInscricao(orientador.token(), inscricaoId);

        JsonNode perfil = objectMapper.readTree(
                mockMvc.perform(get("/api/orientador/perfil")
                                .header("Authorization", authHeader(orientador.token())))
                        .andExpect(status().isOk())
                        .andReturn().getResponse().getContentAsString()
        );
        assertThat(perfil.get("tipo").asText()).isEqualTo("ORIENTADOR");
        assertThat(perfil.get("projetos").asLong()).isEqualTo(1);
        assertThat(perfil.get("orientandos").asLong()).isEqualTo(1);

        JsonNode atualizado = objectMapper.readTree(
                mockMvc.perform(patch("/api/orientador/perfil")
                                .header("Authorization", authHeader(orientador.token()))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(Map.of(
                                        "nome", "Prof. Carlos Silva",
                                        "email", "carlos.silva@instituicao.edu.br",
                                        "instituicao", "Universidade Federal",
                                        "departamento", "Engenharia",
                                        "titulacao", "PhD",
                                        "bio", "Orientador de TCC"
                                ))))
                        .andExpect(status().isOk())
                        .andReturn().getResponse().getContentAsString()
        );
        assertThat(atualizado.get("nome").asText()).isEqualTo("Prof. Carlos Silva");
        assertThat(atualizado.get("departamento").asText()).isEqualTo("Engenharia");
        assertThat(atualizado.get("titulacao").asText()).isEqualTo("PhD");
        assertThat(atualizado.get("projetos").asLong()).isEqualTo(1);
    }

    @Test
    void alunoNaoPodeAcessarPerfilDoOrientador() throws Exception {
        TestUser aluno = registerAluno("perfil-invalido-aluno");

        mockMvc.perform(get("/api/orientador/perfil")
                        .header("Authorization", authHeader(aluno.token())))
                .andExpect(status().isForbidden());
    }

    @Test
    void atualizarPerfilComNomeEmBrancoDeveFalhar() throws Exception {
        TestUser orientador = registerOrientador("perfil-invalido");

        mockMvc.perform(patch("/api/orientador/perfil")
                        .header("Authorization", authHeader(orientador.token()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "nome", "   ",
                                "email", "x@teste.com"
                        ))))
                .andExpect(status().isBadRequest());
    }
}
