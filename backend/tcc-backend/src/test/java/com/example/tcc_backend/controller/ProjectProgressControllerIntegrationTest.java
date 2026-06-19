package com.example.tcc_backend.controller;

import com.example.tcc_backend.dto.request.AdvanceProgressStepRequest;
import com.example.tcc_backend.dto.request.CreateProjectProgressUpdateRequest;
import com.example.tcc_backend.dto.response.AdvanceProgressStepResponse;
import com.example.tcc_backend.dto.response.ProjectProgressResponse;
import com.example.tcc_backend.dto.response.ProjectProgressUpdateResponse;
import com.example.tcc_backend.dto.response.ProgressStepResponse;
import com.example.tcc_backend.service.EtapaProgressoService;
import com.example.tcc_backend.support.ControllerTestSupport;
import com.example.tcc_backend.support.TestDataFactory;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class ProjectProgressControllerIntegrationTest {

    @Mock
    private EtapaProgressoService etapaProgressoService;

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        mockMvc = ControllerTestSupport.buildMockMvc(new ProjectProgressController(etapaProgressoService));
    }

    @Test
    void obterResumoDeveRetornarPayloadEstruturado() throws Exception {
        var resumo = ProjectProgressResponse.builder()
                .projectId(10)
                .overallPercent(25)
                .steps(List.of(
                        ProgressStepResponse.builder().id(1).title("Etapa 1").weight(10).stepOrder(1).build()
                ))
                .updates(List.of())
                .build();

        when(etapaProgressoService.obterResumo(10)).thenReturn(resumo);

        mockMvc.perform(get("/api/projects/10/progress"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.projectId").value(10))
                .andExpect(jsonPath("$.overallPercent").value(25))
                .andExpect(jsonPath("$.steps[0].title").value("Etapa 1"));
    }

    @Test
    void concluirEtapaDeveRetornarPercentualAtualizado() throws Exception {
        var response = AdvanceProgressStepResponse.builder()
                .overallPercent(35)
                .step(ProgressStepResponse.builder().id(1).title("Etapa 1").build())
                .build();

        when(etapaProgressoService.avancarEtapa(anyInt(), anyInt(), any())).thenReturn(response);

        AdvanceProgressStepRequest request = new AdvanceProgressStepRequest();
        request.setStatus("done");

        mockMvc.perform(patch("/api/projects/10/steps/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.overallPercent").value(35))
                .andExpect(jsonPath("$.step.title").value("Etapa 1"));
    }

    @Test
    void criarAtualizacaoDeveRetornarCreated() throws Exception {
        var response = ProjectProgressUpdateResponse.builder()
                .id(9)
                .title("Capitulo 2")
                .category("progress")
                .build();

        when(etapaProgressoService.criarAtualizacao(anyInt(), any())).thenReturn(response);

        CreateProjectProgressUpdateRequest request = new CreateProjectProgressUpdateRequest();
        request.setTitulo("Capitulo 2");
        request.setCategoria("progress");

        mockMvc.perform(post("/api/projects/10/updates")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("Capitulo 2"))
                .andExpect(jsonPath("$.category").value("progress"));
    }
}
