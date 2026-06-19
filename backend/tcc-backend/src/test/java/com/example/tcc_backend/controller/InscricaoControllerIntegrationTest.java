package com.example.tcc_backend.controller;

import com.example.tcc_backend.dto.request.InscricaoRequest;
import com.example.tcc_backend.model.Inscricao;
import com.example.tcc_backend.service.InscricaoService;
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
class InscricaoControllerIntegrationTest {

    @Mock
    private InscricaoService inscricaoService;

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        mockMvc = ControllerTestSupport.buildMockMvc(new InscricaoController(inscricaoService));
    }

    @Test
    void findAllDeveRetornarInscricoes() throws Exception {
        Inscricao inscricao = inscricaoExemplo(1, 10);
        when(inscricaoService.findAll()).thenReturn(List.of(inscricao));

        mockMvc.perform(get("/api/inscricoes"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].status").value("APROVADO"));
    }

    @Test
    void findByIdDeveRetornarInscricao() throws Exception {
        Inscricao inscricao = inscricaoExemplo(2, 10);
        when(inscricaoService.findById(2)).thenReturn(inscricao);

        mockMvc.perform(get("/api/inscricoes/2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(2))
                .andExpect(jsonPath("$.projetoId").value(10));
    }

    @Test
    void findByProjetoDeveRetornarLista() throws Exception {
        when(inscricaoService.findByProjeto(10)).thenReturn(List.of(inscricaoExemplo(3, 10)));

        mockMvc.perform(get("/api/inscricoes/projeto/10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(3));
    }

    @Test
    void createDeveRetornarInscricaoCriada() throws Exception {
        InscricaoRequest request = InscricaoRequest.builder()
                .projetoId(10)
                .build();

        when(inscricaoService.create(any(InscricaoRequest.class))).thenReturn(inscricaoExemplo(4, 10));

        mockMvc.perform(post("/api/inscricoes")
                        .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(4))
                .andExpect(jsonPath("$.projetoId").value(10));
    }

    @Test
    void createDeveValidarBody() throws Exception {
        mockMvc.perform(post("/api/inscricoes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void aprovarDeveRetornarInscricaoAprovada() throws Exception {
        when(inscricaoService.aprovar(5, null)).thenReturn(inscricaoExemplo(5, 10));

        mockMvc.perform(put("/api/inscricoes/5/aprovar"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(5))
                .andExpect(jsonPath("$.status").value("APROVADO"));
    }

    @Test
    void rejeitarDeveRetornarInscricaoRejeitada() throws Exception {
        Inscricao inscricao = inscricaoExemplo(6, 10);
        inscricao.setStatus(com.example.tcc_backend.model.StatusInscricao.REJEITADO);
        when(inscricaoService.rejeitar(6, null)).thenReturn(inscricao);

        mockMvc.perform(put("/api/inscricoes/6/rejeitar"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(6))
                .andExpect(jsonPath("$.status").value("REJEITADO"));
    }

    @Test
    void cancelDeveRetornarNoContent() throws Exception {
        doNothing().when(inscricaoService).cancel(7);

        mockMvc.perform(delete("/api/inscricoes/7"))
                .andExpect(status().isNoContent());
    }

    @Test
    void updateDeveRetornarInscricaoAtualizada() throws Exception {
        InscricaoRequest request = InscricaoRequest.builder()
                .projetoId(11)
                .build();

        when(inscricaoService.update(any(Integer.class), any(InscricaoRequest.class))).thenReturn(inscricaoExemplo(8, 11));

        mockMvc.perform(put("/api/inscricoes/8")
                        .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(8))
                .andExpect(jsonPath("$.projetoId").value(11));
    }

    private Inscricao inscricaoExemplo(Integer inscricaoId, Integer projetoId) {
        var usuario = TestDataFactory.usuarioAluno(inscricaoId);
        var aluno = TestDataFactory.aluno(inscricaoId, usuario);
        var projeto = TestDataFactory.projetoComOrientador(projetoId, TestDataFactory.orientador(20, TestDataFactory.usuarioOrientador(20)));
        return TestDataFactory.inscricaoAprovada(inscricaoId, aluno, projeto);
    }
}
