package com.example.tcc_backend.functional;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class AdminFunctionalTest extends FunctionalTestSupport {

    @Test
    void adminDashboardDeveRetornarEstatisticas() throws Exception {
        TestUser admin = createAdminAndLogin();

        mockMvc.perform(get("/api/admin/dashboard")
                        .header("Authorization", authHeader(admin.token())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalUsuarios").isNumber());
    }

    @Test
    void adminListarUsuariosDeveRetornarLista() throws Exception {
        TestUser admin = createAdminAndLogin();
        registerAluno("admin-list");

        JsonNode usuarios = objectMapper.readTree(
                mockMvc.perform(get("/api/admin/usuarios")
                                .header("Authorization", authHeader(admin.token())))
                        .andExpect(status().isOk())
                        .andReturn().getResponse().getContentAsString()
        );
        assertThat(usuarios.has("content") || usuarios.isArray()).isTrue();
    }

    @Test
    void adminBuscarUsuarioPorId() throws Exception {
        TestUser admin = createAdminAndLogin();
        TestUser aluno = registerAluno("admin-find");

        mockMvc.perform(get("/api/admin/usuarios/" + aluno.userId())
                        .header("Authorization", authHeader(admin.token())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(aluno.userId()));
    }

    @Test
    void adminDesativarReativarUsuario() throws Exception {
        TestUser admin = createAdminAndLogin();
        TestUser aluno = registerAluno("admin-toggle");

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
    }

    @Test
    void adminListarProjetos() throws Exception {
        TestUser admin = createAdminAndLogin();

        mockMvc.perform(get("/api/admin/projetos")
                        .header("Authorization", authHeader(admin.token())))
                .andExpect(status().isOk());
    }

    @Test
    void adminListarInscricoes() throws Exception {
        TestUser admin = createAdminAndLogin();

        mockMvc.perform(get("/api/admin/inscricoes")
                        .header("Authorization", authHeader(admin.token())))
                .andExpect(status().isOk());
    }

    @Test
    void adminRelatoriosResumo() throws Exception {
        TestUser admin = createAdminAndLogin();

        mockMvc.perform(get("/api/admin/relatorios/resumo")
                        .header("Authorization", authHeader(admin.token())))
                .andExpect(status().isOk());
    }

    @Test
    void adminAuditoria() throws Exception {
        TestUser admin = createAdminAndLogin();

        mockMvc.perform(get("/api/admin/auditoria")
                        .header("Authorization", authHeader(admin.token())))
                .andExpect(status().isOk());
    }

    @Test
    void alunoNaoAcessaAdmin() throws Exception {
        TestUser admin = createAdminAndLogin();
        TestUser aluno = registerAluno("admin-forbidden");

        mockMvc.perform(get("/api/admin/dashboard")
                        .header("Authorization", authHeader(aluno.token())))
                .andExpect(status().isForbidden());
    }

    @Test
    void semTokenNaoAcessaAdmin() throws Exception {
        mockMvc.perform(get("/api/admin/dashboard"))
                .andExpect(status().isUnauthorized());
    }
}
