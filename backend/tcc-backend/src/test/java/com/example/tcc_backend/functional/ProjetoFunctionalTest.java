package com.example.tcc_backend.functional;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class ProjetoFunctionalTest extends FunctionalTestSupport {

    @Test
    void criarProjetoComoOrientador() throws Exception {
        TestUser orientador = registerOrientador("proj-create");
        Integer areaId = createArea("IA", createCurso("CC"));

        Integer projetoId = createProjetoAsOrientador(orientador.token(), "Projeto Teste", areaId);
        assertThat(projetoId).isNotNull();

        JsonNode projeto = objectMapper.readTree(
                mockMvc.perform(get("/api/projetos/" + projetoId)
                                .header("Authorization", authHeader(orientador.token())))
                        .andExpect(status().isOk())
                        .andReturn().getResponse().getContentAsString()
        );
        assertThat(projeto.get("titulo").asText()).isEqualTo("Projeto Teste");
        assertThat(projeto.get("status").asText()).isEqualTo("ABERTO");
    }

    @Test
    void listarProjetosDeveRetornarLista() throws Exception {
        TestUser orientador = registerOrientador("proj-list");
        Integer areaId = createArea("Redes", createCurso("CC"));
        createProjetoAsOrientador(orientador.token(), "Projeto 1", areaId);
        createProjetoAsOrientador(orientador.token(), "Projeto 2", areaId);

        JsonNode projetos = objectMapper.readTree(
                mockMvc.perform(get("/api/projetos")
                                .header("Authorization", authHeader(orientador.token())))
                        .andExpect(status().isOk())
                        .andReturn().getResponse().getContentAsString()
        );
        assertThat(projetos.isArray()).isTrue();
        assertThat(projetos.size()).isGreaterThanOrEqualTo(2);
    }

    @Test
    void filtrarPorStatusDeveRetornarFiltrados() throws Exception {
        TestUser orientador = registerOrientador("proj-filter");
        Integer areaId = createArea("DevOps", createCurso("ES"));
        createProjetoAsOrientador(orientador.token(), "Projeto Aberto", areaId);

        JsonNode projetos = objectMapper.readTree(
                mockMvc.perform(get("/api/projetos").param("status", "ABERTO")
                                .header("Authorization", authHeader(orientador.token())))
                        .andExpect(status().isOk())
                        .andReturn().getResponse().getContentAsString()
        );
        assertThat(projetos.isArray()).isTrue();
        for (JsonNode p : projetos) {
            assertThat(p.get("status").asText()).isEqualTo("ABERTO");
        }
    }

    @Test
    void atualizarProjetoDeveFuncionar() throws Exception {
        TestUser orientador = registerOrientador("proj-update");
        Integer areaId = createArea("IA", createCurso("CC"));
        Integer projetoId = createProjetoAsOrientador(orientador.token(), "Original", areaId);

        mockMvc.perform(put("/api/projetos/" + projetoId)
                        .header("Authorization", authHeader(orientador.token()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "titulo", "Atualizado",
                                "descricao", "Nova descricao",
                                "requisitos", "Python",
                                "vagas", 3,
                                "areaId", areaId
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.titulo").value("Atualizado"));
    }

    @Test
    void deletarProjetoDeveRetornarNoContent() throws Exception {
        TestUser orientador = registerOrientador("proj-delete");
        Integer areaId = createArea("IA", createCurso("CC"));
        Integer projetoId = createProjetoAsOrientador(orientador.token(), "Para Deletar", areaId);

        mockMvc.perform(delete("/api/projetos/" + projetoId)
                        .header("Authorization", authHeader(orientador.token())))
                .andExpect(status().isNoContent());
    }

    @Test
    void criarProjetoSemTokenDeveRetornar401() throws Exception {
        Integer areaId = createArea("IA", createCurso("CC"));

        mockMvc.perform(post("/api/projetos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "titulo", "Sem Auth",
                                "descricao", "Teste",
                                "requisitos", "Java",
                                "vagas", 1,
                                "areaId", areaId
                        ))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void criarProjetoComBodyInvalidoDeveRetornar400() throws Exception {
        TestUser orientador = registerOrientador("proj-invalid");

        mockMvc.perform(post("/api/projetos")
                        .header("Authorization", authHeader(orientador.token()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void recrutarColaboradorDeveFuncionar() throws Exception {
        TestUser orientador = registerOrientador("proj-recruit");
        TestUser aluno = registerAluno("proj-recruit-aluno");
        Integer areaId = createArea("IA", createCurso("CC"));
        Integer projetoId = createProjetoAsOrientador(orientador.token(), "Projeto Recrutamento", areaId);

        mockMvc.perform(post("/api/projetos/" + projetoId + "/recrutar")
                        .header("Authorization", authHeader(orientador.token()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("usuarioId", aluno.userId()))))
                .andExpect(status().isOk());
    }

    @Test
    void listarColaboradoresDeveRetornarLista() throws Exception {
        TestUser orientador = registerOrientador("proj-collab");
        TestUser aluno = registerAluno("proj-collab-aluno");
        Integer areaId = createArea("IA", createCurso("CC"));
        Integer projetoId = createProjetoAsOrientador(orientador.token(), "Projeto Colaboradores", areaId);

        mockMvc.perform(post("/api/projetos/" + projetoId + "/recrutar")
                        .header("Authorization", authHeader(orientador.token()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("usuarioId", aluno.userId()))))
                .andExpect(status().isOk());

        JsonNode colaboradores = objectMapper.readTree(
                mockMvc.perform(get("/api/projetos/" + projetoId + "/colaboradores")
                                .header("Authorization", authHeader(orientador.token())))
                        .andExpect(status().isOk())
                        .andReturn().getResponse().getContentAsString()
        );
        assertThat(colaboradores.isArray()).isTrue();
        assertThat(colaboradores.size()).isGreaterThanOrEqualTo(1);
    }
}
