package com.example.tcc_backend.controller;

import com.example.tcc_backend.dto.response.IdNomeResponse;
import com.example.tcc_backend.service.AreaPesquisaCatalogService;
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
class AreaPesquisaControllerIntegrationTest {

    @Mock
    private AreaPesquisaCatalogService service;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = ControllerTestSupport.buildMockMvc(new AreaPesquisaController(service));
    }

    @Test
    void listDeveRetornarAreas() throws Exception {
        when(service.list()).thenReturn(List.of(
                new IdNomeResponse(1, "IA"),
                new IdNomeResponse(2, "Engenharia de Software")
        ));

        mockMvc.perform(get("/api/areas"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].nome").value("IA"))
                .andExpect(jsonPath("$[1].id").value(2));
    }
}

