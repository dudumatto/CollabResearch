package com.example.tcc_backend.controller;

import com.example.tcc_backend.dto.response.IdNomeResponse;
import com.example.tcc_backend.service.CursoCatalogService;
import com.example.tcc_backend.support.ControllerTestSupport;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class CursoControllerIntegrationTest {

    @Mock
    private CursoCatalogService service;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = ControllerTestSupport.buildMockMvc(new CursoController(service));
    }

    @Test
    void listDeveRetornarCursos() throws Exception {
        when(service.list()).thenReturn(List.of(
                new IdNomeResponse(1, "Ciencia da Computacao"),
                new IdNomeResponse(2, "Engenharia de Computacao")
        ));

        mockMvc.perform(get("/api/cursos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].nome").value("Ciencia da Computacao"));
    }
}

