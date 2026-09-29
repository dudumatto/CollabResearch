package com.example.tcc_backend.functional;

import org.junit.jupiter.api.Test;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class MeuCalendarioFunctionalTest extends FunctionalTestSupport {

    @Test
    void listarPrazosDoUsuarioDeveRetornarArrayAutenticado() throws Exception {
        TestUser aluno = registerAluno("calendar-route");

        mockMvc.perform(get("/api/me/prazos-etapas")
                        .header("Authorization", authHeader(aluno.token())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }
}
