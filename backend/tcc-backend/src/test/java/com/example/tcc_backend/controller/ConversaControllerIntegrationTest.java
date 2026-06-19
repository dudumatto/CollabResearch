package com.example.tcc_backend.controller;

import com.example.tcc_backend.dto.request.ConversaRequest;
import com.example.tcc_backend.dto.request.MensagemRequest;
import com.example.tcc_backend.model.Conversa;
import com.example.tcc_backend.model.Mensagem;
import com.example.tcc_backend.model.Usuario;
import com.example.tcc_backend.security.AuthHelper;
import com.example.tcc_backend.service.ConversaService;
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

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class ConversaControllerIntegrationTest {

    @Mock
    private ConversaService conversaService;

    @Mock
    private AuthHelper authHelper;

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        mockMvc = ControllerTestSupport.buildMockMvc(new ConversaController(conversaService, authHelper));
    }

    @Test
    void criarDeveRetornarConversaCriada() throws Exception {
        when(authHelper.getCurrentUser()).thenReturn(TestDataFactory.usuarioAluno(1));
        ConversaRequest request = new ConversaRequest();
        request.setProjetoId(10);

        Conversa conversa = TestDataFactory.conversa(
                1,
                TestDataFactory.projetoComOrientador(10, TestDataFactory.orientador(2, TestDataFactory.usuarioOrientador(2)))
        );

        when(conversaService.criar(10)).thenReturn(conversa);

        mockMvc.perform(post("/api/conversas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.projetoId").value(10));
    }

    @Test
    void criarDeveValidarBody() throws Exception {
        mockMvc.perform(post("/api/conversas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void listarConversasDeveRetornarLista() throws Exception {
        when(authHelper.getCurrentUser()).thenReturn(TestDataFactory.usuarioAluno(1));
        Conversa conversa = TestDataFactory.conversa(
                2,
                TestDataFactory.projetoComAlunoCriador(10, TestDataFactory.aluno(1, TestDataFactory.usuarioAluno(1)))
        );

        when(conversaService.listarConversasDoUsuario(1)).thenReturn(List.of(conversa));

        mockMvc.perform(get("/api/conversas/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(2))
                .andExpect(jsonPath("$[0].projetoId").value(10));
    }

    @Test
    void listarMinhasTodasDeveAceitarRotaMobileEmIngles() throws Exception {
        when(authHelper.getCurrentUser()).thenReturn(TestDataFactory.usuarioAluno(1));
        Conversa conversa = TestDataFactory.conversa(
                2,
                TestDataFactory.projetoComAlunoCriador(10, TestDataFactory.aluno(1, TestDataFactory.usuarioAluno(1)))
        );

        when(conversaService.listarTodasConversasDoUsuario(1)).thenReturn(List.of(conversa));

        mockMvc.perform(get("/api/chat/conversations"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(2))
                .andExpect(jsonPath("$[0].projetoId").value(10));
    }

    @Test
    void listarMensagensDeveRetornarLista() throws Exception {
        Conversa conversa = TestDataFactory.conversa(
                3,
                TestDataFactory.projetoComAlunoCriador(10, TestDataFactory.aluno(1, TestDataFactory.usuarioAluno(1)))
        );
        Mensagem mensagem = TestDataFactory.mensagem(4, conversa, TestDataFactory.usuarioAluno(1));

        when(conversaService.listarMensagens(3)).thenReturn(List.of(mensagem));

        mockMvc.perform(get("/api/conversas/3/mensagens"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(4))
                .andExpect(jsonPath("$[0].conteudo").value("Mensagem de teste"));
    }

    @Test
    void listarMensagensDeveAceitarRotaMobileEmIngles() throws Exception {
        Conversa conversa = TestDataFactory.conversa(
                3,
                TestDataFactory.projetoComAlunoCriador(10, TestDataFactory.aluno(1, TestDataFactory.usuarioAluno(1)))
        );
        Mensagem mensagem = TestDataFactory.mensagem(4, conversa, TestDataFactory.usuarioAluno(1));

        when(conversaService.listarMensagens(3)).thenReturn(List.of(mensagem));

        mockMvc.perform(get("/api/chat/conversations/3/messages"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(4));
    }

    @Test
    void enviarMensagemDeveRetornarMensagemCriada() throws Exception {
        MensagemRequest request = new MensagemRequest();
        request.setConteudo("Ola");

        Conversa conversa = TestDataFactory.conversa(
                5,
                TestDataFactory.projetoComAlunoCriador(10, TestDataFactory.aluno(1, TestDataFactory.usuarioAluno(1)))
        );
        Mensagem mensagem = TestDataFactory.mensagem(6, conversa, TestDataFactory.usuarioAluno(1));
        mensagem.setConteudo("Ola");

        when(conversaService.enviarMensagem(5, "Ola")).thenReturn(mensagem);

        mockMvc.perform(post("/api/conversas/5/mensagem")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(6))
                .andExpect(jsonPath("$.conteudo").value("Ola"));
    }

    @Test
    void enviarMensagemDeveAceitarRotaMobileEmInglesEContent() throws Exception {
        Conversa conversa = TestDataFactory.conversa(
                5,
                TestDataFactory.projetoComAlunoCriador(10, TestDataFactory.aluno(1, TestDataFactory.usuarioAluno(1)))
        );
        Mensagem mensagem = TestDataFactory.mensagem(6, conversa, TestDataFactory.usuarioAluno(1));
        mensagem.setConteudo("Ola");

        when(conversaService.enviarMensagem(5, "Ola")).thenReturn(mensagem);

        mockMvc.perform(post("/api/chat/conversations/5/messages")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"content\":\"Ola\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(6))
                .andExpect(jsonPath("$.conteudo").value("Ola"));
    }

    @Test
    void enviarMensagemDeveValidarBody() throws Exception {
        MensagemRequest request = new MensagemRequest();
        request.setConteudo("");

        mockMvc.perform(post("/api/conversas/5/mensagem")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }
}
