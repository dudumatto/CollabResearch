package com.example.tcc_backend.controller;

import com.example.tcc_backend.dto.request.ProgressoRequest;
import com.example.tcc_backend.model.Progresso;
import com.example.tcc_backend.service.ProgressoService;
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
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class ProgressoControllerIntegrationTest {

    @Mock
    private ProgressoService progressoService;

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        mockMvc = ControllerTestSupport.buildMockMvc(new ProgressoController(progressoService));
    }

    @Test
    void criarDeveRetornarProgressoResponse() throws Exception {
        ProgressoRequest request = new ProgressoRequest();
        request.setDescricao("Primeira entrega");

        Progresso progresso = TestDataFactory.progresso(
                1,
                TestDataFactory.projetoComAlunoCriador(10, TestDataFactory.aluno(1, TestDataFactory.usuarioAluno(1))),
                TestDataFactory.usuarioAluno(1)
        );

        when(progressoService.criar(any(Integer.class), any(ProgressoRequest.class))).thenReturn(progresso);

        mockMvc.perform(post("/api/projetos/10/progresso")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.projetoId").value(10))
                .andExpect(jsonPath("$.autorId").value(1));
    }

    @Test
    void listarPorProjetoDeveRetornarLista() throws Exception {
        Progresso progresso = TestDataFactory.progresso(
                1,
                TestDataFactory.projetoComAlunoCriador(10, TestDataFactory.aluno(1, TestDataFactory.usuarioAluno(1))),
                TestDataFactory.usuarioAluno(1)
        );

        when(progressoService.listarPorProjeto(10)).thenReturn(List.of(progresso));

        mockMvc.perform(get("/api/projetos/10/progresso"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].descricao").value("Atualizacao"));
    }

    @Test
    void atualizarDeveRetornarProgressoAtualizado() throws Exception {
        ProgressoRequest request = new ProgressoRequest();
        request.setDescricao("Entrega final");

        Progresso progresso = TestDataFactory.progresso(
                2,
                TestDataFactory.projetoComAlunoCriador(10, TestDataFactory.aluno(1, TestDataFactory.usuarioAluno(1))),
                TestDataFactory.usuarioAluno(1)
        );
        progresso.setDescricao("Entrega final");

        when(progressoService.atualizar(any(Integer.class), any(ProgressoRequest.class))).thenReturn(progresso);

        mockMvc.perform(put("/api/progresso/2")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(2))
                .andExpect(jsonPath("$.descricao").value("Entrega final"));
    }

    @Test
    void removerDeveRetornarNoContent() throws Exception {
        doNothing().when(progressoService).remover(2);

        mockMvc.perform(delete("/api/progresso/2"))
                .andExpect(status().isNoContent());
    }
}
