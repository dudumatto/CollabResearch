package com.example.tcc_backend.functional;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class UsuarioListFunctionalTest extends FunctionalTestSupport {

    @Test
    void listarUsuariosDeveRetornarListaNaoVazia() throws Exception {
        TestUser orientador = registerOrientador("list-orient");
        TestUser aluno1 = registerAluno("list-1");
        TestUser aluno2 = registerAluno("list-2");

        JsonNode usuarios = objectMapper.readTree(
                mockMvc.perform(get("/api/usuarios")
                                .header("Authorization", authHeader(orientador.token())))
                        .andExpect(status().isOk())
                        .andReturn().getResponse().getContentAsString()
        );

        assertThat(usuarios.isArray()).isTrue();
        assertThat(usuarios.size()).isGreaterThanOrEqualTo(2);
    }

    @Test
    void listarUsuariosDeveIncluirCamposObrigatorios() throws Exception {
        TestUser orientador = registerOrientador("fields-orient");
        TestUser user = registerAluno("fields");

        JsonNode usuarios = objectMapper.readTree(
                mockMvc.perform(get("/api/usuarios")
                                .header("Authorization", authHeader(orientador.token())))
                        .andExpect(status().isOk())
                        .andReturn().getResponse().getContentAsString()
        );

        assertThat(usuarios.size()).isGreaterThanOrEqualTo(1);

        boolean found = false;
        for (JsonNode u : usuarios) {
            if (u.get("id").asInt() == user.userId()) {
                found = true;
                assertThat(u.has("nome")).isTrue();
                assertThat(u.has("email")).isTrue();
                assertThat(u.has("tipo")).isTrue();
            }
        }
        assertThat(found).isTrue();
    }

    @Test
    void listarOrientadoresDeveRetornarOrientadores() throws Exception {
        TestUser orientador = registerOrientador("list-orient");

        JsonNode orientadores = objectMapper.readTree(
                mockMvc.perform(get("/api/usuarios/orientadores")
                                .header("Authorization", authHeader(orientador.token())))
                        .andExpect(status().isOk())
                        .andReturn().getResponse().getContentAsString()
        );

        assertThat(orientadores.isArray()).isTrue();
        assertThat(orientadores.size()).isGreaterThanOrEqualTo(1);

        boolean found = false;
        for (JsonNode o : orientadores) {
            if (o.get("id").asInt() == orientador.userId()) {
                found = true;
            }
        }
        assertThat(found).isTrue();
    }

    @Test
    void listarUsuariosSemTokenDeveRetornar401() throws Exception {
        mockMvc.perform(get("/api/usuarios"))
                .andExpect(status().isUnauthorized());
    }
}