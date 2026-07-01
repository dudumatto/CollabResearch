package com.example.tcc_backend.functional.flows;

import com.example.tcc_backend.functional.FunctionalTestSupport;
import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class AdminModerationFlowTest extends FunctionalTestSupport {

    @Test
    void adminModeraSistemaCompleto() throws Exception {
        TestUser admin = createAdminAndLogin();
        TestUser aluno = registerAluno("admin-aluno");
        TestUser orientador = registerOrientador("admin-orient");

        JsonNode usuariosJson = objectMapper.readTree(
                mockMvc.perform(get("/api/admin/usuarios")
                                .header("Authorization", authHeader(admin.token())))
                        .andExpect(status().isOk())
                        .andReturn().getResponse().getContentAsString()
        );
        assertThat(usuariosJson.get("totalElements").asLong()).isGreaterThanOrEqualTo(3);

        JsonNode usuarioJson = objectMapper.readTree(
                mockMvc.perform(get("/api/admin/usuarios/" + aluno.userId())
                                .header("Authorization", authHeader(admin.token())))
                        .andExpect(status().isOk())
                        .andReturn().getResponse().getContentAsString()
        );
        assertThat(usuarioJson.get("id").asInt()).isEqualTo(aluno.userId());

        mockMvc.perform(patch("/api/admin/usuarios/" + aluno.userId() + "/ativo")
                        .header("Authorization", authHeader(admin.token()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("ativo", false))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ativo").value(false));

        mockMvc.perform(patch("/api/admin/usuarios/" + aluno.userId() + "/ativo")
                        .header("Authorization", authHeader(admin.token()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("ativo", true))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ativo").value(true));

        JsonNode projetosJson = objectMapper.readTree(
                mockMvc.perform(get("/api/admin/projetos")
                                .header("Authorization", authHeader(admin.token())))
                        .andExpect(status().isOk())
                        .andReturn().getResponse().getContentAsString()
        );
        assertThat(projetosJson.has("content")).isTrue();

        JsonNode inscricoesJson = objectMapper.readTree(
                mockMvc.perform(get("/api/admin/inscricoes")
                                .header("Authorization", authHeader(admin.token())))
                        .andExpect(status().isOk())
                        .andReturn().getResponse().getContentAsString()
        );
        assertThat(inscricoesJson.has("content")).isTrue();

        mockMvc.perform(get("/api/admin/dashboard")
                        .header("Authorization", authHeader(admin.token())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalUsuarios").isNumber());

        mockMvc.perform(get("/api/admin/relatorios/resumo")
                        .header("Authorization", authHeader(admin.token())))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/admin/auditoria")
                        .header("Authorization", authHeader(admin.token())))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/admin/dashboard")
                        .header("Authorization", authHeader(aluno.token())))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/admin/dashboard")
                        .header("Authorization", authHeader(orientador.token())))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/admin/dashboard"))
                .andExpect(status().isUnauthorized());
    }
}