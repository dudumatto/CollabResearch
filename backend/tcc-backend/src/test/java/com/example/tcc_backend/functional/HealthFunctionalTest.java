package com.example.tcc_backend.functional;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class HealthFunctionalTest extends FunctionalTestSupport {

    @Test
    void healthEndpointDeveRetornar200() throws Exception {
        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk());
    }

    @Test
    void healthSupabaseStorageDeveRetornar200Ou503() throws Exception {
        mockMvc.perform(get("/api/health/supabase-storage"))
                .andExpect(result -> {
                    int status = result.getResponse().getStatus();
                    assertThat(status == 200 || status == 503)
                            .as("Status deve ser 200 ou 503, recebeu %d", status)
                            .isTrue();
                });
    }
}
