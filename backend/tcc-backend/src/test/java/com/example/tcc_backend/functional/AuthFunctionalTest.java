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
    void loginDeveRetornar429AposVariasSenhasIncorretas() throws Exception {
        TestUser registered = registerAluno("bruteforce-lock");
        String ip = "203.0.113.10";

        for (int i = 0; i < 5; i++) {
            loginRequest(registered.email(), "SenhaErrada" + i + "!", ip)
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
        }

        loginRequest(registered.email(), "OutraSenhaErrada!", ip)
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.status").value(429));
    }

    @Test
    void senhaCorretaDeveSerRecusadaEnquantoCooldownEstaAtivo() throws Exception {
        TestUser registered = registerAluno("bruteforce-correct-blocked");
        String ip = "203.0.113.11";

        for (int i = 0; i < 5; i++) {
            loginRequest(registered.email(), "SenhaErrada" + i + "!", ip)
                    .andExpect(status().isUnauthorized());
        }

        loginRequest(registered.email(), registered.password(), ip)
                .andExpect(status().isTooManyRequests());
    }

    @Test
    void loginBemSucedidoDeveLimparFalhasAnteriores() throws Exception {
        TestUser registered = registerAluno("bruteforce-reset");
        String ip = "203.0.113.12";

        for (int i = 0; i < 4; i++) {
            loginRequest(registered.email(), "SenhaErrada" + i + "!", ip)
                    .andExpect(status().isUnauthorized());
        }

        loginRequest(registered.email(), registered.password(), ip)
                .andExpect(status().isOk());

        for (int i = 0; i < 4; i++) {
            loginRequest(registered.email(), "NovaSenhaErrada" + i + "!", ip)
                    .andExpect(status().isUnauthorized());
        }

        loginRequest(registered.email(), "AindaErrada!", ip)
                .andExpect(status().isUnauthorized());
    }

    @Test
    void tentativasEmOutraContaEOutroIpNaoDevemBloquearUsuarioDiferente() throws Exception {
        TestUser blocked = registerAluno("bruteforce-isolated-a");
        TestUser other = registerAluno("bruteforce-isolated-b");

        for (int i = 0; i < 5; i++) {
            loginRequest(blocked.email(), "SenhaErrada" + i + "!", "203.0.113.13")
                    .andExpect(status().isUnauthorized());
        }

        loginRequest(other.email(), other.password(), "203.0.113.14")
                .andExpect(status().isOk());
    }

    @Test
    void tentativasComEmailInexistenteTambemDevemSerLimitadas() throws Exception {
        String email = "inexistente-bruteforce@teste.com";
        String ip = "203.0.113.15";

        for (int i = 0; i < 5; i++) {
            loginRequest(email, "SenhaErrada" + i + "!", ip)
                    .andExpect(status().isUnauthorized());
        }

        loginRequest(email, "SenhaErradaFinal!", ip)
                .andExpect(status().isTooManyRequests());
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
    private org.springframework.test.web.servlet.ResultActions loginRequest(String email, String senha, String ip) throws Exception {
        return mockMvc.perform(post("/api/auth/login")
                .with(request -> {
                    request.setRemoteAddr(ip);
                    return request;
                })
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of(
                        "email", email,
                        "senha", senha
                ))));
    }
}