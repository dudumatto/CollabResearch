package com.example.tcc_backend.functional;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class DashboardFunctionalTest extends FunctionalTestSupport {

    @Test
    void dashboardDeveRetornarDados() throws Exception {
        TestUser user = registerAluno("dash-test");

        JsonNode dashboard = objectMapper.readTree(
                mockMvc.perform(get("/api/dashboard")
                                .header("Authorization", authHeader(user.token())))
                        .andExpect(status().isOk())
                        .andReturn().getResponse().getContentAsString()
        );

        assertThat(dashboard.has("usuarioId")).isTrue();
        assertThat(dashboard.has("totalProjetos")).isTrue();
        assertThat(dashboard.has("minhasInscricoes")).isTrue();
    }

    @Test
    void dashboardSemTokenDeveRetornar401() throws Exception {
        mockMvc.perform(get("/api/dashboard"))
                .andExpect(status().isUnauthorized());
    }
}
