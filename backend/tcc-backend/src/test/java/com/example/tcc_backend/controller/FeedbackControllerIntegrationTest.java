package com.example.tcc_backend.controller;

import com.example.tcc_backend.dto.request.FeedbackRequest;
import com.example.tcc_backend.model.Feedback;
import com.example.tcc_backend.service.FeedbackService;
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
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class FeedbackControllerIntegrationTest {

    @Mock
    private FeedbackService feedbackService;

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        mockMvc = ControllerTestSupport.buildMockMvc(new FeedbackController(feedbackService));
    }

    @Test
    void criarDeveRetornarFeedbackResponse() throws Exception {
        FeedbackRequest request = new FeedbackRequest();
        request.setProjetoId(10);
        request.setNota(5);
        request.setComentario("Excelente");

        Feedback feedback = TestDataFactory.feedback(
                1,
                TestDataFactory.projetoComOrientador(10, TestDataFactory.orientador(2, TestDataFactory.usuarioOrientador(2))),
                TestDataFactory.usuarioAluno(1)
        );

        when(feedbackService.criar(any(FeedbackRequest.class))).thenReturn(feedback);

        mockMvc.perform(post("/api/feedback")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.projetoId").value(10))
                .andExpect(jsonPath("$.avaliadorId").value(1));
    }

    @Test
    void listarPorProjetoDeveRetornarLista() throws Exception {
        Feedback feedback = TestDataFactory.feedback(
                1,
                TestDataFactory.projetoComOrientador(10, TestDataFactory.orientador(2, TestDataFactory.usuarioOrientador(2))),
                TestDataFactory.usuarioAluno(1)
        );

        when(feedbackService.listarPorProjeto(10)).thenReturn(List.of(feedback));

        mockMvc.perform(get("/api/feedback/projeto/10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].nota").value(5));
    }

    @Test
    void listarPorUsuarioDeveRetornarLista() throws Exception {
        Feedback feedback = TestDataFactory.feedback(
                2,
                TestDataFactory.projetoComOrientador(11, TestDataFactory.orientador(2, TestDataFactory.usuarioOrientador(2))),
                TestDataFactory.usuarioAluno(1)
        );

        when(feedbackService.listarPorUsuario(1)).thenReturn(List.of(feedback));

        mockMvc.perform(get("/api/feedback/usuario/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(2))
                .andExpect(jsonPath("$[0].avaliadorId").value(1));
    }
}
