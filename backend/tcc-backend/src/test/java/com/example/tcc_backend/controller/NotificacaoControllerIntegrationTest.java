package com.example.tcc_backend.controller;

import com.example.tcc_backend.model.Notificacao;
import com.example.tcc_backend.service.NotificacaoService;
import com.example.tcc_backend.support.ControllerTestSupport;
import com.example.tcc_backend.support.TestDataFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class NotificacaoControllerIntegrationTest {

    @Mock
    private NotificacaoService notificacaoService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = ControllerTestSupport.buildMockMvc(new NotificacaoController(notificacaoService));
    }

    @Test
    void listarMinhasDeveRetornarNotificacoes() throws Exception {
        Notificacao notificacao = TestDataFactory.notificacao(1, TestDataFactory.usuarioAluno(1));
        when(notificacaoService.minhasNotificacoes()).thenReturn(List.of(notificacao));

        mockMvc.perform(get("/api/notificacoes"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].tipo").value("MENSAGEM_RECEBIDA"))
                .andExpect(jsonPath("$[0].mensagem").value("Nova notificacao"));
    }

    @Test
    void listarMinhasDeveAceitarRotaMobileEmIngles() throws Exception {
        Notificacao notificacao = TestDataFactory.notificacao(1, TestDataFactory.usuarioAluno(1));
        when(notificacaoService.minhasNotificacoes()).thenReturn(List.of(notificacao));

        mockMvc.perform(get("/api/notifications"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1));
    }

    @Test
    void marcarComoLidaDeveRetornarNotificacao() throws Exception {
        Notificacao notificacao = TestDataFactory.notificacao(2, TestDataFactory.usuarioAluno(1));
        notificacao.setLida(true);
        when(notificacaoService.marcarComoLida(2)).thenReturn(notificacao);

        mockMvc.perform(put("/api/notificacoes/2/ler"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(2))
                .andExpect(jsonPath("$.lida").value(true));
    }

    @Test
    void marcarTodasComoLidasDeveRetornarNoContent() throws Exception {
        doNothing().when(notificacaoService).marcarTodasComoLidas();

        mockMvc.perform(put("/api/notificacoes/ler-todas"))
                .andExpect(status().isNoContent());
    }

    @Test
    void marcarTodasComoLidasDeveAceitarRotaMobileEmIngles() throws Exception {
        doNothing().when(notificacaoService).marcarTodasComoLidas();

        mockMvc.perform(put("/api/notifications/read-all"))
                .andExpect(status().isNoContent());
    }
}
