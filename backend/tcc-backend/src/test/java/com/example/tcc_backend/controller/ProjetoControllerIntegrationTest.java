package com.example.tcc_backend.controller;

import com.example.tcc_backend.dto.request.ProjetoRequest;
import com.example.tcc_backend.dto.request.RecrutarColaboradorRequest;
import com.example.tcc_backend.model.Inscricao;
import com.example.tcc_backend.model.Projeto;
import com.example.tcc_backend.model.StatusProjeto;
import com.example.tcc_backend.service.ProjetoService;
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
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class ProjetoControllerIntegrationTest {

    @Mock
    private ProjetoService projetoService;

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        mockMvc = ControllerTestSupport.buildMockMvc(new ProjetoController(projetoService));
    }

    @Test
    void findAllDeveRetornarProjetos() throws Exception {
        Projeto projeto = TestDataFactory.projetoComOrientador(10, TestDataFactory.orientador(2, TestDataFactory.usuarioOrientador(2)));
        when(projetoService.findAll(eq(null), eq(null), eq(null), eq(null), eq(null))).thenReturn(List.of(projeto));

        mockMvc.perform(get("/api/projetos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(10))
                .andExpect(jsonPath("$[0].titulo").value("Projeto 10"));
    }

    @Test
    void findAllDeveAceitarRotaMobileEmIngles() throws Exception {
        Projeto projeto = TestDataFactory.projetoComOrientador(10, TestDataFactory.orientador(2, TestDataFactory.usuarioOrientador(2)));
        when(projetoService.findAll(eq(null), eq(null), eq(null), eq("ADS"), eq(null))).thenReturn(List.of(projeto));

        mockMvc.perform(get("/api/projects").param("course", "ADS"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(10));
    }

    @Test
    void findAllComStatusDeveFiltrar() throws Exception {
        Projeto projeto = TestDataFactory.projetoComOrientador(11, TestDataFactory.orientador(2, TestDataFactory.usuarioOrientador(2)));
        projeto.setStatus(StatusProjeto.EM_ANDAMENTO);
        when(projetoService.findAll(eq("EM_ANDAMENTO"), eq(null), eq(null), eq(null), eq(null))).thenReturn(List.of(projeto));

        mockMvc.perform(get("/api/projetos").param("status", "EM_ANDAMENTO"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].status").value("EM_ANDAMENTO"));
    }

    @Test
    void findAllComStatusInvalidoDeveRetornarBadRequest() throws Exception {
        when(projetoService.findAll(eq("desconhecido"), eq(null), eq(null), eq(null), eq(null)))
                .thenThrow(new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.BAD_REQUEST, "Status invalido"));
        mockMvc.perform(get("/api/projetos").param("status", "desconhecido"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void findAllComAreaIdDeveFiltrar() throws Exception {
        when(projetoService.findAll(eq(null), eq(7), eq(null), eq(null), eq(null))).thenReturn(List.of(
                TestDataFactory.projetoComAlunoCriador(12, TestDataFactory.aluno(1, TestDataFactory.usuarioAluno(1)))
        ));

        mockMvc.perform(get("/api/projetos").param("areaId", "7"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(12));
    }

    @Test
    void findAllComAreaDeveFiltrar() throws Exception {
        when(projetoService.findAll(eq(null), eq(null), eq("IA"), eq(null), eq(null))).thenReturn(List.of(
                TestDataFactory.projetoComAlunoCriador(13, TestDataFactory.aluno(1, TestDataFactory.usuarioAluno(1)))
        ));

        mockMvc.perform(get("/api/projetos").param("area", "IA"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(13));
    }

    @Test
    void findAllComCursoDeveFiltrar() throws Exception {
        when(projetoService.findAll(eq(null), eq(null), eq(null), eq("ADS"), eq(null))).thenReturn(List.of(
                TestDataFactory.projetoComAlunoCriador(14, TestDataFactory.aluno(1, TestDataFactory.usuarioAluno(1)))
        ));

        mockMvc.perform(get("/api/projetos").param("curso", "ADS"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(14));
    }

    @Test
    void findAllComBuscaDeveFiltrar() throws Exception {
        when(projetoService.findAll(eq(null), eq(null), eq(null), eq(null), eq("java"))).thenReturn(List.of(
                TestDataFactory.projetoComAlunoCriador(15, TestDataFactory.aluno(1, TestDataFactory.usuarioAluno(1)))
        ));

        mockMvc.perform(get("/api/projetos").param("busca", "java"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(15));
    }

    @Test
    void findByIdDeveRetornarProjeto() throws Exception {
        Projeto projeto = TestDataFactory.projetoComOrientador(10, TestDataFactory.orientador(2, TestDataFactory.usuarioOrientador(2)));
        when(projetoService.findById(10)).thenReturn(projeto);

        mockMvc.perform(get("/api/projetos/10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(10))
                .andExpect(jsonPath("$.titulo").value("Projeto 10"));
    }

    @Test
    void createDeveRetornarProjetoCriado() throws Exception {
        ProjetoRequest request = new ProjetoRequest();
        request.setTitulo("Projeto Novo");
        request.setDescricao("Descricao");
        request.setRequisitos("Java");
        request.setVagas(2);
        request.setAreaId(3);

        Projeto projeto = TestDataFactory.projetoComOrientador(20, TestDataFactory.orientador(2, TestDataFactory.usuarioOrientador(2)));
        projeto.setTitulo("Projeto Novo");
        projeto.setVagas(2);

        when(projetoService.create(any(ProjetoRequest.class))).thenReturn(projeto);

        mockMvc.perform(post("/api/projetos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(20))
                .andExpect(jsonPath("$.titulo").value("Projeto Novo"));
    }

    @Test
    void createDeveValidarBody() throws Exception {
        ProjetoRequest request = new ProjetoRequest();
        request.setTitulo("");

        mockMvc.perform(post("/api/projetos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void updateDeveRetornarProjetoAtualizado() throws Exception {
        ProjetoRequest request = new ProjetoRequest();
        request.setTitulo("Projeto Atualizado");
        request.setDescricao("Descricao");
        request.setRequisitos("Spring");
        request.setVagas(3);
        request.setAreaId(4);

        Projeto projeto = TestDataFactory.projetoComOrientador(20, TestDataFactory.orientador(2, TestDataFactory.usuarioOrientador(2)));
        projeto.setTitulo("Projeto Atualizado");
        projeto.setVagas(3);

        when(projetoService.update(any(Integer.class), any(ProjetoRequest.class))).thenReturn(projeto);

        mockMvc.perform(put("/api/projetos/20")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.titulo").value("Projeto Atualizado"))
                .andExpect(jsonPath("$.vagas").value(3));
    }

    @Test
    void aceitarOrientacaoDeveRetornarProjetoAberto() throws Exception {
        Projeto projeto = TestDataFactory.projetoComOrientador(20, TestDataFactory.orientador(2, TestDataFactory.usuarioOrientador(2)));
        projeto.setStatus(StatusProjeto.ABERTO);

        when(projetoService.aceitarOrientacao(20)).thenReturn(projeto);

        mockMvc.perform(put("/api/projetos/20/aceitar-orientacao"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(20))
                .andExpect(jsonPath("$.status").value("ABERTO"));
    }

    @Test
    void rejeitarOrientacaoDeveRetornarProjetoRecusado() throws Exception {
        Projeto projeto = TestDataFactory.projetoComOrientador(20, TestDataFactory.orientador(2, TestDataFactory.usuarioOrientador(2)));
        projeto.setStatus(StatusProjeto.REJEITADO_ORIENTADOR);

        when(projetoService.rejeitarOrientacao(20)).thenReturn(projeto);

        mockMvc.perform(put("/api/projetos/20/rejeitar-orientacao"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(20))
                .andExpect(jsonPath("$.status").value("REJEITADO_ORIENTADOR"));
    }

    @Test
    void deleteDeveRetornarNoContent() throws Exception {
        doNothing().when(projetoService).delete(20);

        mockMvc.perform(delete("/api/projetos/20"))
                .andExpect(status().isNoContent());
    }

    @Test
    void recrutarDeveRetornarInscricao() throws Exception {
        RecrutarColaboradorRequest request = new RecrutarColaboradorRequest();
        request.setUsuarioId(3);

        var aluno = TestDataFactory.aluno(3, TestDataFactory.usuarioAluno(3));
        var projeto = TestDataFactory.projetoComOrientador(20, TestDataFactory.orientador(2, TestDataFactory.usuarioOrientador(2)));
        Inscricao inscricao = TestDataFactory.inscricaoAprovada(30, aluno, projeto);

        when(projetoService.recrutar(20, 3)).thenReturn(inscricao);

        mockMvc.perform(post("/api/projetos/20/recrutar")
                        .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(30))
                .andExpect(jsonPath("$.alunoId").value(3));
    }

    @Test
    void listarColaboradoresDeveRetornarUsuarios() throws Exception {
        when(projetoService.listarColaboradores(20)).thenReturn(List.of(
                TestDataFactory.usuarioAluno(1),
                TestDataFactory.usuarioAluno(2)
        ));

        mockMvc.perform(get("/api/projetos/20/colaboradores"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[1].id").value(2));
    }

    @Test
    void removerColaboradorDeveRetornarNoContent() throws Exception {
        doNothing().when(projetoService).removerColaborador(20, 3);

        mockMvc.perform(delete("/api/projetos/20/colaboradores/3"))
                .andExpect(status().isNoContent());
    }
}
