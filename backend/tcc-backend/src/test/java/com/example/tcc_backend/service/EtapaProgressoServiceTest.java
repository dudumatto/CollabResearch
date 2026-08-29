package com.example.tcc_backend.service;

import com.example.tcc_backend.dto.request.AdvanceProgressStepRequest;
import com.example.tcc_backend.dto.request.CreateProjectProgressUpdateRequest;
import com.example.tcc_backend.dto.request.EtapaRequest;
import com.example.tcc_backend.model.*;
import com.example.tcc_backend.repository.EtapaProgressoRepository;
import com.example.tcc_backend.repository.InscricaoRepository;
import com.example.tcc_backend.repository.ProgressoRepository;
import com.example.tcc_backend.repository.ProjetoRepository;
import com.example.tcc_backend.security.AuthHelper;
import com.example.tcc_backend.security.ProjectAccessPolicy;
import com.example.tcc_backend.support.TestDataFactory;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EtapaProgressoServiceTest {

    @Mock
    private EtapaProgressoRepository etapaProgressoRepository;
    @Mock
    private ProgressoRepository progressoRepository;
    @Mock
    private ProjetoRepository projetoRepository;
    @Mock
    private InscricaoRepository inscricaoRepository;
    @Mock
    private AuthHelper authHelper;
    @Mock
    private ProjectAccessPolicy projectAccessPolicy;

    @InjectMocks
    private EtapaProgressoService etapaProgressoService;

    @Test
    void obterResumoDeveRetornarEtapasEAtualizacoes() {
        Usuario alunoUsuario = TestDataFactory.usuarioAluno(1);
        Projeto projeto = TestDataFactory.projetoComAlunoCriador(10, TestDataFactory.aluno(1, alunoUsuario));
        EtapaProgresso etapaAtiva = TestDataFactory.etapaProgresso(1, projeto, null, 1, 10, EtapaProgressoStatus.ACTIVE);
        EtapaProgresso etapaConcluida = TestDataFactory.etapaProgresso(2, projeto, alunoUsuario, 2, 15, EtapaProgressoStatus.DONE);
        Progresso progresso = TestDataFactory.progressoComEtapa(3, projeto, alunoUsuario, etapaConcluida);

        when(authHelper.getCurrentUser()).thenReturn(alunoUsuario);
        when(projetoRepository.findById(10)).thenReturn(Optional.of(projeto));
        when(etapaProgressoRepository.findByProjetoIdOrderByOrdemAsc(10)).thenReturn(List.of(etapaAtiva, etapaConcluida));
        when(progressoRepository.findByProjetoIdOrderByDataRegistroDesc(10)).thenReturn(List.of(progresso));

        var resumo = etapaProgressoService.obterResumo(10);

        assertThat(resumo.getProjectId()).isEqualTo(10);
        assertThat(resumo.getOverallPercent()).isEqualTo(15);
        assertThat(resumo.getSteps()).hasSize(2);
        assertThat(resumo.getUpdates()).hasSize(1);
    }

    @Test
    void listarEtapasDeveCriarEtapasPadraoQuandoNaoExistirem() {
        Usuario alunoUsuario = TestDataFactory.usuarioAluno(1);
        Projeto projeto = TestDataFactory.projetoComAlunoCriador(10, TestDataFactory.aluno(1, alunoUsuario));
        EtapaProgresso etapaPadrao = TestDataFactory.etapaProgresso(1, projeto, null, 1, 10, EtapaProgressoStatus.ACTIVE);
        etapaPadrao.setTitulo("Proposta aprovada");

        when(authHelper.getCurrentUser()).thenReturn(alunoUsuario);
        when(projetoRepository.findById(10)).thenReturn(Optional.of(projeto));
        when(etapaProgressoRepository.findByProjetoIdOrderByOrdemAsc(10))
                .thenReturn(List.of(), List.of(etapaPadrao));

        var etapas = etapaProgressoService.listarEtapas(10);

        assertThat(etapas).hasSize(1);
        assertThat(etapas.get(0).getTitulo()).isEqualTo("Proposta aprovada");
        verify(projectAccessPolicy).requireCanViewTeam(projeto, alunoUsuario);
        verify(etapaProgressoRepository).saveAll(any());
    }

    @Test
    void avancarEtapaDeveNegarAlunoEmEtapaDoOrientador() {
        Usuario alunoUsuario = TestDataFactory.usuarioAluno(1);
        Projeto projeto = TestDataFactory.projetoComAlunoCriador(10, TestDataFactory.aluno(1, alunoUsuario));
        EtapaProgresso etapa = TestDataFactory.etapaProgresso(1, projeto, null, 1, 10, EtapaProgressoStatus.ACTIVE);

        when(authHelper.getCurrentUser()).thenReturn(alunoUsuario);
        when(projetoRepository.findById(10)).thenReturn(Optional.of(projeto));
        when(etapaProgressoRepository.findByProjetoIdOrderByOrdemAsc(10)).thenReturn(List.of(etapa));
        when(etapaProgressoRepository.findByProjetoIdAndId(10, 1)).thenReturn(Optional.of(etapa));

        AdvanceProgressStepRequest request = new AdvanceProgressStepRequest();
        request.setStatus("done");

        assertThatThrownBy(() -> etapaProgressoService.avancarEtapa(10, 1, request))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN));
    }

    @Test
    void criarAtualizacaoDeveSalvarCategoriaEtapaEContribuicao() {
        Usuario alunoUsuario = TestDataFactory.usuarioAluno(1);
        Projeto projeto = TestDataFactory.projetoComAlunoCriador(10, TestDataFactory.aluno(1, alunoUsuario));
        EtapaProgresso etapa = TestDataFactory.etapaProgresso(2, projeto, null, 2, 15, EtapaProgressoStatus.ACTIVE);

        CreateProjectProgressUpdateRequest request = new CreateProjectProgressUpdateRequest();
        request.setTitulo("Capitulo 2");
        request.setDescricao("Texto");
        request.setCategoria("milestone");
        request.setEtapaId(2);
        request.setEtapaContribuicao(60);

        when(authHelper.getCurrentUser()).thenReturn(alunoUsuario);
        when(projetoRepository.findById(10)).thenReturn(Optional.of(projeto));
        when(etapaProgressoRepository.findByProjetoIdAndId(10, 2)).thenReturn(Optional.of(etapa));
        when(progressoRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        var response = etapaProgressoService.criarAtualizacao(10, request);

        assertThat(response.getCategory()).isEqualTo("milestone");
        assertThat(response.getStepContribution()).isEqualTo(60);
        verify(progressoRepository).save(any());
    }

    @Test
    void criarAtualizacaoDevePermitirDataNulaQuandoMarcadaSemData() {
        Usuario alunoUsuario = TestDataFactory.usuarioAluno(1);
        Projeto projeto = TestDataFactory.projetoComAlunoCriador(10, TestDataFactory.aluno(1, alunoUsuario));
        EtapaProgresso etapa = TestDataFactory.etapaProgresso(2, projeto, null, 2, 15, EtapaProgressoStatus.ACTIVE);

        CreateProjectProgressUpdateRequest request = new CreateProjectProgressUpdateRequest();
        request.setTitulo("Atualizacao sem data");
        request.setCategoria("progress");
        request.setEtapaId(2);
        request.setSemData(true);

        when(authHelper.getCurrentUser()).thenReturn(alunoUsuario);
        when(projetoRepository.findById(10)).thenReturn(Optional.of(projeto));
        when(etapaProgressoRepository.findByProjetoIdAndId(10, 2)).thenReturn(Optional.of(etapa));
        when(progressoRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        var response = etapaProgressoService.criarAtualizacao(10, request);

        assertThat(response.getCreatedAt()).isNull();
        verify(progressoRepository).save(any());
    }
    @Test
    void criarEtapaDeveExigirOrientadorResponsavel() {
        Usuario orientadorUsuario = TestDataFactory.usuarioOrientador(2);
        Projeto projeto = TestDataFactory.projetoComOrientador(10, TestDataFactory.orientador(1, orientadorUsuario));

        EtapaRequest request = new EtapaRequest();
        request.setTitulo("Etapa personalizada");
        request.setPeso(20);
        request.setResponsavel(EtapaResponsavel.ALUNO);

        when(authHelper.getCurrentUser()).thenReturn(orientadorUsuario);
        when(projetoRepository.findById(10)).thenReturn(Optional.of(projeto));
        when(etapaProgressoRepository.findByProjetoIdOrderByOrdemAsc(10)).thenReturn(List.of());
        when(etapaProgressoRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        var response = etapaProgressoService.criarEtapa(10, request);

        assertThat(response.getTitulo()).isEqualTo("Etapa personalizada");
        assertThat(response.getResponsavel()).isEqualTo(EtapaResponsavel.ALUNO);
        assertThat(response.getStatus()).isEqualTo(EtapaProgressoStatus.ACTIVE);
        verify(projectAccessPolicy).requireResponsibleAdvisor(projeto, orientadorUsuario);
    }

    @Test
    void atualizarEtapaConcluidaDeveLancarConflito() {
        Usuario orientadorUsuario = TestDataFactory.usuarioOrientador(2);
        Projeto projeto = TestDataFactory.projetoComOrientador(10, TestDataFactory.orientador(1, orientadorUsuario));
        EtapaProgresso etapaConcluida = TestDataFactory.etapaProgresso(1, projeto, orientadorUsuario, 1, 10, EtapaProgressoStatus.DONE);

        EtapaRequest request = new EtapaRequest();
        request.setTitulo("Novo titulo");

        when(authHelper.getCurrentUser()).thenReturn(orientadorUsuario);
        when(projetoRepository.findById(10)).thenReturn(Optional.of(projeto));
        when(etapaProgressoRepository.findByProjetoIdAndId(10, 1)).thenReturn(Optional.of(etapaConcluida));

        assertThatThrownBy(() -> etapaProgressoService.atualizarEtapa(10, 1, request))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode()).isEqualTo(HttpStatus.CONFLICT));
    }

    @Test
    void concluirEtapaNaoDevePermitirAlunoEmEtapaDoOrientador() {
        Usuario alunoUsuario = TestDataFactory.usuarioAluno(1);
        Projeto projeto = TestDataFactory.projetoComAlunoCriador(10, TestDataFactory.aluno(1, alunoUsuario));
        EtapaProgresso etapa = TestDataFactory.etapaProgresso(1, projeto, null, 1, 10, EtapaProgressoStatus.ACTIVE);
        etapa.setResponsavel(EtapaResponsavel.ORIENTADOR);

        when(authHelper.getCurrentUser()).thenReturn(alunoUsuario);
        when(projetoRepository.findById(10)).thenReturn(Optional.of(projeto));
        when(etapaProgressoRepository.findByProjetoIdAndId(10, 1)).thenReturn(Optional.of(etapa));
        when(projectAccessPolicy.relationship(projeto, alunoUsuario))
                .thenReturn(ProjectAccessPolicy.Relationship.STUDENT_CREATOR);

        AdvanceProgressStepRequest request = new AdvanceProgressStepRequest();
        request.setStatus("done");

        assertThatThrownBy(() -> etapaProgressoService.concluirEtapa(10, 1, request))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN));
    }

    @Test
    void concluirEtapaDevePermitirAlunoEmEtapaDoAluno() {
        Usuario alunoUsuario = TestDataFactory.usuarioAluno(1);
        Projeto projeto = TestDataFactory.projetoComAlunoCriador(10, TestDataFactory.aluno(1, alunoUsuario));
        EtapaProgresso etapa = TestDataFactory.etapaProgresso(1, projeto, null, 1, 10, EtapaProgressoStatus.ACTIVE);
        etapa.setResponsavel(EtapaResponsavel.ALUNO);

        when(authHelper.getCurrentUser()).thenReturn(alunoUsuario);
        when(projetoRepository.findById(10)).thenReturn(Optional.of(projeto));
        when(etapaProgressoRepository.findByProjetoIdAndId(10, 1)).thenReturn(Optional.of(etapa));
        when(projectAccessPolicy.relationship(projeto, alunoUsuario))
                .thenReturn(ProjectAccessPolicy.Relationship.STUDENT_CREATOR);

        AdvanceProgressStepRequest request = new AdvanceProgressStepRequest();
        request.setStatus("done");

        var response = etapaProgressoService.concluirEtapa(10, 1, request);

        assertThat(response.getStatus()).isEqualTo(EtapaProgressoStatus.DONE);
        assertThat(response.getConcluidaPorId()).isEqualTo(1);
        verify(etapaProgressoRepository).save(any());
    }

    @Test
    void criarEtapaDeveBloquearProjetoFinalizado() {
        Usuario orientadorUsuario = TestDataFactory.usuarioOrientador(2);
        Projeto projeto = TestDataFactory.projetoComOrientador(10, TestDataFactory.orientador(1, orientadorUsuario));
        projeto.setStatus(StatusProjeto.FINALIZADO);

        EtapaRequest request = new EtapaRequest();
        request.setTitulo("Etapa bloqueada");

        when(authHelper.getCurrentUser()).thenReturn(orientadorUsuario);
        when(projetoRepository.findById(10)).thenReturn(Optional.of(projeto));

        assertThatThrownBy(() -> etapaProgressoService.criarEtapa(10, request))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> {
                    ResponseStatusException response = (ResponseStatusException) ex;
                    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
                    assertThat(response.getReason()).isEqualTo("Projeto finalizado nao permite alteracoes de progresso");
                });
    }

    @Test
    void concluirEtapaDeveBloquearProjetoFinalizado() {
        Usuario alunoUsuario = TestDataFactory.usuarioAluno(1);
        Projeto projeto = TestDataFactory.projetoComAlunoCriador(10, TestDataFactory.aluno(1, alunoUsuario));
        projeto.setStatus(StatusProjeto.FINALIZADO);

        AdvanceProgressStepRequest request = new AdvanceProgressStepRequest();
        request.setStatus("done");

        when(authHelper.getCurrentUser()).thenReturn(alunoUsuario);
        when(projetoRepository.findById(10)).thenReturn(Optional.of(projeto));

        assertThatThrownBy(() -> etapaProgressoService.concluirEtapa(10, 1, request))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode()).isEqualTo(HttpStatus.CONFLICT));
    }
}
