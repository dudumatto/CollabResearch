package com.example.tcc_backend.controller;

import com.example.tcc_backend.dto.request.UsuarioRequest;
import com.example.tcc_backend.model.Inscricao;
import com.example.tcc_backend.model.Projeto;
import com.example.tcc_backend.service.DocumentoService;
import com.example.tcc_backend.service.InscricaoService;
import com.example.tcc_backend.service.UsuarioService;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class UsuarioControllerIntegrationTest {

    @Mock
    private UsuarioService usuarioService;

    @Mock
    private DocumentoService documentoService;

    @Mock
    private InscricaoService inscricaoService;

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        mockMvc = ControllerTestSupport.buildMockMvc(new UsuarioController(usuarioService, documentoService, inscricaoService));
    }

    @Test
    void findAllDeveRetornarUsuarios() throws Exception {
        when(usuarioService.findAll()).thenReturn(List.of(
                TestDataFactory.usuarioAluno(1),
                TestDataFactory.usuarioOrientador(2)
        ));

        mockMvc.perform(get("/api/usuarios"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].tipo").value("ALUNO"))
                .andExpect(jsonPath("$[1].id").value(2))
                .andExpect(jsonPath("$[1].tipo").value("ORIENTADOR"));
    }

    @Test
    void findByIdDeveRetornarUsuario() throws Exception {
        when(usuarioService.findById(1)).thenReturn(TestDataFactory.usuarioAluno(1));

        mockMvc.perform(get("/api/usuarios/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.email").value("aluno1@teste.com"));
    }

    @Test
    void updateDeveRetornarUsuarioAtualizado() throws Exception {
        UsuarioRequest request = UsuarioRequest.builder()
                .nome("Aluno Atualizado")
                .email("novo@teste.com")
                .build();

        var usuarioAtualizado = TestDataFactory.usuarioAluno(1);
        usuarioAtualizado.setNome("Aluno Atualizado");
        usuarioAtualizado.setEmail("novo@teste.com");

        when(usuarioService.update(any(Integer.class), any(UsuarioRequest.class))).thenReturn(usuarioAtualizado);

        mockMvc.perform(put("/api/usuarios/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.nome").value("Aluno Atualizado"))
                .andExpect(jsonPath("$.email").value("novo@teste.com"));
    }

    @Test
    void updateDeveValidarBody() throws Exception {
        UsuarioRequest request = UsuarioRequest.builder()
                .nome("")
                .email("email-invalido")
                .build();

        mockMvc.perform(put("/api/usuarios/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void deleteDeveRetornarNoContent() throws Exception {
        doNothing().when(usuarioService).delete(1);

        mockMvc.perform(delete("/api/usuarios/1"))
                .andExpect(status().isNoContent());
    }

    @Test
    void findProjetosByUsuarioDeveRetornarLista() throws Exception {
        Projeto projeto = TestDataFactory.projetoComAlunoCriador(
                10,
                TestDataFactory.aluno(1, TestDataFactory.usuarioAluno(1))
        );

        when(usuarioService.findProjetosByUsuario(1)).thenReturn(List.of(projeto));

        mockMvc.perform(get("/api/usuarios/1/projetos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(10))
                .andExpect(jsonPath("$[0].titulo").value("Projeto 10"));
    }

    @Test
    void findInscricoesByUsuarioDeveRetornarLista() throws Exception {
        var usuario = TestDataFactory.usuarioAluno(1);
        var aluno = TestDataFactory.aluno(1, usuario);
        var projeto = TestDataFactory.projetoComOrientador(10, TestDataFactory.orientador(2, TestDataFactory.usuarioOrientador(2)));
        Inscricao inscricao = TestDataFactory.inscricaoAprovada(5, aluno, projeto);

        when(usuarioService.findInscricoesByUsuario(1)).thenReturn(List.of(inscricao));

        mockMvc.perform(get("/api/usuarios/1/inscricoes"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(5))
                .andExpect(jsonPath("$[0].status").value("APROVADO"));
    }

    @Test
    void findMinhasInscricoesDeveRetornarLista() throws Exception {
        var usuario = TestDataFactory.usuarioAluno(1);
        var aluno = TestDataFactory.aluno(1, usuario);
        var projeto = TestDataFactory.projetoComOrientador(10, TestDataFactory.orientador(2, TestDataFactory.usuarioOrientador(2)));
        Inscricao inscricao = TestDataFactory.inscricaoAprovada(6, aluno, projeto);

        when(inscricaoService.findByUsuarioLogado()).thenReturn(List.of(inscricao));

        mockMvc.perform(get("/api/usuarios/minhas-inscricoes"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(6))
                .andExpect(jsonPath("$[0].projetoId").value(10));
    }

    @Test
    void findDocumentosByUsuarioDeveRetornarLista() throws Exception {
        var documento = TestDataFactory.documento(3, TestDataFactory.usuarioAluno(1), "uploads/documentos/1/curriculo.pdf");

        when(documentoService.listarPorUsuario(1)).thenReturn(List.of(documento));

        mockMvc.perform(get("/api/usuarios/1/documentos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(3))
                .andExpect(jsonPath("$[0].nomeArquivo").value("curriculo.pdf"));
    }
}
