package com.example.tcc_backend.functional;

import com.example.tcc_backend.model.TipoUsuario;
import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class AuthFunctionalTest extends FunctionalTestSupport {

    @Test
    void registerAlunoDeveRetornarToken() throws Exception {
        TestUser user = registerAluno("auth-aluno");

        assertThat(user.token()).isNotBlank();
        assertThat(user.userId()).isNotNull();

        JsonNode userJson = objectMapper.readTree(
                mockMvc.perform(get("/api/usuarios/" + user.userId())
                                .header("Authorization", authHeader(user.token())))
                        .andExpect(status().isOk())
                        .andReturn().getResponse().getContentAsString()
        );
        assertThat(userJson.get("email").asText()).isEqualTo(user.email());
        assertThat(userJson.get("tipo").asText()).isEqualTo("ALUNO");
    }

    @Test
    void registerOrientadorDeveRetornarToken() throws Exception {
        TestUser user = registerOrientador("auth-orient");

        assertThat(user.token()).isNotBlank();
        assertThat(user.userId()).isNotNull();

        JsonNode userJson = objectMapper.readTree(
                mockMvc.perform(get("/api/usuarios/" + user.userId())
                                .header("Authorization", authHeader(user.token())))
                        .andExpect(status().isOk())
                        .andReturn().getResponse().getContentAsString()
        );
        assertThat(userJson.get("tipo").asText()).isEqualTo("ORIENTADOR");
    }

    @Test
    void loginDeveRetornarToken() throws Exception {
        TestUser registered = registerAluno("login-test");
        TestUser logged = login(registered.email(), registered.password());

        assertThat(logged.token()).isNotBlank();
        assertThat(logged.userId()).isEqualTo(registered.userId());
    }

    @Test
    void loginComSenhaIncorretaDeveRetornar401() throws Exception {
        TestUser registered = registerAluno("wrong-pw");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", registered.email(),
                                "senha", "SenhaErrada123!"
                        ))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void registroDuplicadoDeveRetornar409() throws Exception {
        TestUser first = registerAluno("dup-test");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "nome", "Aluno Duplicado",
                                "email", first.email(),
                                "senha", "Senha123!",
                                "tipo", TipoUsuario.ALUNO,
                                "ra", "RA99999"
                        ))))
                .andExpect(status().isConflict());
    }

    @Test
    void changePasswordDeveFuncionar() throws Exception {
        TestUser user = registerAluno("change-pw");
        String novaSenha = "NovaSenha456!";

        mockMvc.perform(put("/api/auth/senha")
                        .header("Authorization", authHeader(user.token()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "senhaAtual", user.password(),
                                "novaSenha", novaSenha
                        ))))
                .andExpect(status().isNoContent());

        TestUser logged = login(user.email(), novaSenha);
        assertThat(logged.token()).isNotBlank();
    }

    @Test
    void logoutDeveFuncionar() throws Exception {
        TestUser user = registerAluno("logout-test");

        mockMvc.perform(post("/api/auth/logout")
                        .header("Authorization", authHeader(user.token())))
                .andExpect(status().isOk())
                .andExpect(content().string("Logout realizado com sucesso"));
    }

    @Test
    void endpointProtegidoSemTokenDeveRetornar401() throws Exception {
        mockMvc.perform(get("/api/usuarios/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }
}