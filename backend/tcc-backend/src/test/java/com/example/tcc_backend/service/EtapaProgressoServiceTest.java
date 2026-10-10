package com.example.tcc_backend.service;

import com.example.tcc_backend.dto.request.AdvanceProgressStepRequest;
import com.example.tcc_backend.dto.request.CreateProjectProgressUpdateRequest;
import com.example.tcc_backend.dto.request.EtapaRequest;
import com.example.tcc_backend.model.*;
import com.example.tcc_backend.dto.request.OrdemRequest;
import com.example.tcc_backend.repository.EtapaProgressoRepository;
import com.example.tcc_backend.repository.EtapaRevisaoRepository;
import com.example.tcc_backend.repository.EtapaTarefaRepository;
import com.example.tcc_backend.repository.InscricaoRepository;
import com.example.tcc_backend.repository.ProgressoRepository;
import com.example.tcc_backend.repository.ProjetoRepository;
import com.example.tcc_backend.security.AuthHelper;
import com.example.tcc_backend.security.ProjectAccessPolicy;
import com.example.tcc_backend.support.TestDataFactory;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.BeforeEach;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
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

    @Mock
    private EtapaTarefaRepository etapaTarefaRepository;
    @Mock
    private EtapaRevisaoRepository etapaRevisaoRepository;
    @Mock
    private EtapaChecklistService checklistService;

    private EtapaProgressoService etapaProgressoService;

    @BeforeEach
    void setUp() {
        etapaProgressoService = new EtapaProgressoService(
                etapaProgressoRepository, progressoRepository, projetoRepository, inscricaoRepository,
                new EtapaResponseAssembler(etapaTarefaRepository, etapaRevisaoRepository),
                checklistService, authHelper, projectAccessPolicy);
    }

    private static EtapaTarefa tarefa(int id, EtapaProgresso etapa, boolean concluida) {
        return EtapaTarefa.builder().id(id).etapa(etapa).titulo("Item " + id).origem(TarefaOrigem.ORIENTADOR)
                .obrigatoria(false).concluida(concluida).ordem(id).build();
    }

    @Test
    void calendarioDoAlunoBuscaProjetosPropriosEInscricoesEmUmaConsultaAgregada() {
        Usuario alunoUsuario = TestDataFactory.usuarioAluno(1);
        Projeto projeto = TestDataFactory.projetoComAlunoCriador(10, TestDataFactory.aluno(1, alunoUsuario));
        EtapaProgresso etapa = TestDataFactory.etapaProgresso(1, projeto, null, 1, 10, EtapaProgressoStatus.ACTIVE);

        when(authHelper.getCurrentUser()).thenReturn(alunoUsuario);
        when(projetoRepository.findCalendarioByAlunoUsuarioId(1)).thenReturn(List.of(projeto));
        when(etapaProgressoRepository.findAllForCalendarioByProjetoIds(List.of(10))).thenReturn(List.of(etapa));

        var calendario = etapaProgressoService.listarPrazosEtapasDoUsuario();

        assertThat(calendario).hasSize(1);
        assertThat(calendario.get(0).getProjetoId()).isEqualTo(10);
        assertThat(calendario.get(0).getProjetoTitulo()).isEqualTo(projeto.getTitulo());
        assertThat(calendario.get(0).getId()).isEqualTo(1);
        verify(projetoRepository).findCalendarioByAlunoUsuarioId(1);
        verify(etapaProgressoRepository).findAllForCalendarioByProjetoIds(List.of(10));
    }

    @Test
    void calendarioDoOrientadorBuscaProjetosEEtapasEmLoteSemAlterarStatus() {
        Usuario orientadorUsuario = TestDataFactory.usuarioOrientador(2);
        Projeto projeto = TestDataFactory.projetoComOrientador(20, TestDataFactory.orientador(2, orientadorUsuario));
        EtapaProgresso pendente = TestDataFactory.etapaProgresso(4, projeto, null, 1, 10, EtapaProgressoStatus.PENDING);

        when(authHelper.getCurrentUser()).thenReturn(orientadorUsuario);
        when(projetoRepository.findCalendarioByOrientadorUsuarioId(2)).thenReturn(List.of(projeto));
        when(etapaProgressoRepository.findAllForCalendarioByProjetoIds(List.of(20))).thenReturn(List.of(pendente));

        var calendario = etapaProgressoService.listarPrazosEtapasDoUsuario();

        assertThat(calendario).hasSize(1);
        assertThat(calendario.get(0).getStatus()).isEqualTo(EtapaProgressoStatus.PENDING);
        verify(etapaProgressoRepository, never()).saveAll(any());
        verify(etapaProgressoRepository).findAllForCalendarioByProjetoIds(List.of(20));
    }

    @Test
    void obterResumoUsaItensDosMarcosEMantemCamposAtuais() {
        Usuario alunoUsuario = TestDataFactory.usuarioAluno(1);
        Projeto projeto = TestDataFactory.projetoComAlunoCriador(10, TestDataFactory.aluno(1, alunoUsuario));
        EtapaProgresso emAndamento = TestDataFactory.etapaProgresso(1, projeto, null, 1, 10, EtapaProgressoStatus.ACTIVE);
        EtapaProgresso aprovada = TestDataFactory.etapaProgresso(2, projeto, alunoUsuario, 2, 15, EtapaProgressoStatus.DONE);
        EtapaProgresso semTarefas = TestDataFactory.etapaProgresso(4, projeto, null, 3, 15, EtapaProgressoStatus.PENDING);
        Progresso progresso = TestDataFactory.progressoComEtapa(3, projeto, alunoUsuario, aprovada);

        when(authHelper.getCurrentUser()).thenReturn(alunoUsuario);
        when(projetoRepository.findById(10)).thenReturn(Optional.of(projeto));
        when(etapaProgressoRepository.findByProjetoIdOrderByOrdemAsc(10)).thenReturn(List.of(emAndamento, aprovada, semTarefas));
        when(etapaTarefaRepository.findByEtapaIdInOrderByOrdemAscIdAsc(List.of(1, 2, 4))).thenReturn(List.of(
                tarefa(1, emAndamento, true), tarefa(2, emAndamento, false),
                tarefa(3, aprovada, true), tarefa(4, aprovada, true)));
        when(progressoRepository.findByProjetoIdOrderByDataRegistroDesc(10)).thenReturn(List.of(progresso));

        var resumo = etapaProgressoService.obterResumo(10);

        assertThat(resumo.getProjectId()).isEqualTo(10);
        // 3 de 4 itens, independente do peso (10/15/15) dos marcos
        assertThat(resumo.getOverallPercent()).isEqualTo(75);
        assertThat(resumo.getPercentualGeral()).isEqualTo(75);
        assertThat(resumo.getItensConcluidos()).isEqualTo(3);
        assertThat(resumo.getItensTotal()).isEqualTo(4);
        assertThat(resumo.getMarcosTotal()).isEqualTo(3);
        assertThat(resumo.getMarcosConcluidos()).isEqualTo(1);
        assertThat(resumo.getAtualizacoesTotal()).isEqualTo(1);
        assertThat(resumo.getSteps()).hasSize(3);
        assertThat(resumo.getMarcos()).hasSize(3);
        assertThat(resumo.getMarcos().get(0).getPercentual()).isEqualTo(50);
        assertThat(resumo.getMarcos().get(2).getSemTarefas()).isTrue();
        assertThat(resumo.getMarcos().get(2).getPercentual()).isZero();
        assertThat(resumo.getUpdates()).hasSize(1);
    }

    @Test
    void obterResumoDeProjetoSemMarcosRetornaZeros() {
        Usuario alunoUsuario = TestDataFactory.usuarioAluno(1);
        Projeto projeto = TestDataFactory.projetoComAlunoCriador(10, TestDataFactory.aluno(1, alunoUsuario));

        when(authHelper.getCurrentUser()).thenReturn(alunoUsuario);
        when(projetoRepository.findById(10)).thenReturn(Optional.of(projeto));
        when(etapaProgressoRepository.findByProjetoIdOrderByOrdemAsc(10)).thenReturn(List.of());
        when(progressoRepository.findByProjetoIdOrderByDataRegistroDesc(10)).thenReturn(List.of());

        var resumo = etapaProgressoService.obterResumo(10);

        assertThat(resumo.getPercentualGeral()).isZero();
        assertThat(resumo.getMarcosTotal()).isZero();
        assertThat(resumo.getItensTotal()).isZero();
        assertThat(resumo.getMarcos()).isEmpty();
        verify(etapaProgressoRepository, never()).saveAll(any());
    }

    @Test
    void atualizacaoNarrativaNaoAlteraTarefasNemMarco() {
        Usuario alunoUsuario = TestDataFactory.usuarioAluno(1);
        Projeto projeto = TestDataFactory.projetoComAlunoCriador(10, TestDataFactory.aluno(1, alunoUsuario));
        EtapaProgresso etapa = TestDataFactory.etapaProgresso(2, projeto, null, 2, 0, EtapaProgressoStatus.ACTIVE);

        CreateProjectProgressUpdateRequest request = new CreateProjectProgressUpdateRequest();
        request.setTitulo("Texto livre");
        request.setCategoria("progress");
        request.setEtapaId(2);
        request.setEtapaContribuicao(100);

        when(authHelper.getCurrentUser()).thenReturn(alunoUsuario);
        when(projetoRepository.findById(10)).thenReturn(Optional.of(projeto));
        when(etapaProgressoRepository.findByProjetoIdAndId(10, 2)).thenReturn(Optional.of(etapa));
        when(progressoRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        etapaProgressoService.criarAtualizacao(10, request);

        verify(etapaProgressoRepository, never()).save(any());
        org.mockito.Mockito.verifyNoInteractions(etapaTarefaRepository);
        assertThat(etapa.getStatus()).isEqualTo(EtapaProgressoStatus.ACTIVE);
    }

    @Test
    void listarEtapasNaoCriaMarcosImplicitamente() {
        Usuario alunoUsuario = TestDataFactory.usuarioAluno(1);
        Projeto projeto = TestDataFactory.projetoComAlunoCriador(10, TestDataFactory.aluno(1, alunoUsuario));

        when(authHelper.getCurrentUser()).thenReturn(alunoUsuario);
        when(projetoRepository.findById(10)).thenReturn(Optional.of(projeto));
        when(etapaProgressoRepository.findByProjetoIdOrderByOrdemAsc(10)).thenReturn(List.of());

        assertThat(etapaProgressoService.listarEtapas(10)).isEmpty();
        verify(projectAccessPolicy).requireCanViewTeam(projeto, alunoUsuario);
        verify(etapaProgressoRepository, never()).saveAll(any());
    }

    @Test
    void reordenarEtapasAplicaNovaOrdemEValidaIds() {
        Usuario orientadorUsuario = TestDataFactory.usuarioOrientador(2);
        Projeto projeto = TestDataFactory.projetoComOrientador(10, TestDataFactory.orientador(1, orientadorUsuario));
        EtapaProgresso a = TestDataFactory.etapaProgresso(1, projeto, null, 1, 0, EtapaProgressoStatus.PENDING);
        EtapaProgresso b = TestDataFactory.etapaProgresso(2, projeto, null, 2, 0, EtapaProgressoStatus.PENDING);

        when(authHelper.getCurrentUser()).thenReturn(orientadorUsuario);
        when(projetoRepository.findById(10)).thenReturn(Optional.of(projeto));
        when(etapaProgressoRepository.findByProjetoIdOrderByOrdemAsc(10)).thenReturn(List.of(a, b));

        OrdemRequest repetida = new OrdemRequest();
        repetida.setIds(List.of(2, 2));
        assertThatThrownBy(() -> etapaProgressoService.reordenarEtapas(10, repetida))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST));
        OrdemRequest incompleta = new OrdemRequest();
        incompleta.setIds(List.of(1));
        assertThatThrownBy(() -> etapaProgressoService.reordenarEtapas(10, incompleta))
                .isInstanceOf(ResponseStatusException.class);

        OrdemRequest valida = new OrdemRequest();
        valida.setIds(List.of(2, 1));
        var resposta = etapaProgressoService.reordenarEtapas(10, valida);

        assertThat(b.getOrdem()).isEqualTo(1);
        assertThat(a.getOrdem()).isEqualTo(2);
        assertThat(resposta).extracting(r -> r.getId()).containsExactly(2, 1);
    }

    @Test
    void excluirEtapaRenumeraMarcosRestantes() {
        Usuario orientadorUsuario = TestDataFactory.usuarioOrientador(2);
        Projeto projeto = TestDataFactory.projetoComOrientador(10, TestDataFactory.orientador(1, orientadorUsuario));
        EtapaProgresso removida = TestDataFactory.etapaProgresso(1, projeto, null, 1, 0, EtapaProgressoStatus.PENDING);
        EtapaProgresso restante = TestDataFactory.etapaProgresso(2, projeto, null, 2, 0, EtapaProgressoStatus.PENDING);

        when(authHelper.getCurrentUser()).thenReturn(orientadorUsuario);
        when(projetoRepository.findById(10)).thenReturn(Optional.of(projeto));
        when(etapaProgressoRepository.findByProjetoIdAndId(10, 1)).thenReturn(Optional.of(removida));
        when(etapaProgressoRepository.findByProjetoIdOrderByOrdemAsc(10)).thenReturn(List.of(restante));

        etapaProgressoService.excluirEtapa(10, 1);

        verify(etapaProgressoRepository).delete(removida);
        assertThat(restante.getOrdem()).isEqualTo(1);
    }

    @Test
    void avancarEtapaDeveNegarAlunoPoisAprovacaoEDoOrientador() {
        Usuario alunoUsuario = TestDataFactory.usuarioAluno(1);
        Projeto projeto = TestDataFactory.projetoComAlunoCriador(10, TestDataFactory.aluno(1, alunoUsuario));
        EtapaProgresso etapa = TestDataFactory.etapaProgresso(1, projeto, null, 1, 10, EtapaProgressoStatus.ACTIVE);

        when(authHelper.getCurrentUser()).thenReturn(alunoUsuario);
        when(projetoRepository.findById(10)).thenReturn(Optional.of(projeto));
        when(etapaProgressoRepository.findByProjetoIdAndId(10, 1)).thenReturn(Optional.of(etapa));
        doThrow(new ResponseStatusException(HttpStatus.FORBIDDEN)).when(projectAccessPolicy)
                .requireResponsibleAdvisor(projeto, alunoUsuario);

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
        assertThat(response.getStatus()).isEqualTo(EtapaProgressoStatus.PENDING);
        assertThat(response.getSemTarefas()).isTrue();
        assertThat(response.getItensTotal()).isZero();
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
    void concluirEtapaNaoDevePermitirAluno() {
        Usuario alunoUsuario = TestDataFactory.usuarioAluno(1);
        Projeto projeto = TestDataFactory.projetoComAlunoCriador(10, TestDataFactory.aluno(1, alunoUsuario));
        EtapaProgresso etapa = TestDataFactory.etapaProgresso(1, projeto, null, 1, 10, EtapaProgressoStatus.ACTIVE);
        etapa.setResponsavel(EtapaResponsavel.ALUNO);

        when(authHelper.getCurrentUser()).thenReturn(alunoUsuario);
        when(projetoRepository.findById(10)).thenReturn(Optional.of(projeto));
        when(etapaProgressoRepository.findByProjetoIdAndId(10, 1)).thenReturn(Optional.of(etapa));
        doThrow(new ResponseStatusException(HttpStatus.FORBIDDEN)).when(projectAccessPolicy)
                .requireResponsibleAdvisor(projeto, alunoUsuario);

        AdvanceProgressStepRequest request = new AdvanceProgressStepRequest();
        request.setStatus("done");

        assertThatThrownBy(() -> etapaProgressoService.concluirEtapa(10, 1, request))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN));
        verify(checklistService, never()).aprovar(any(), any(), any());
    }

    @Test
    void concluirEtapaLegadoAprovaViaFluxoDeRevisaoDoOrientador() {
        Usuario orientadorUsuario = TestDataFactory.usuarioOrientador(2);
        Projeto projeto = TestDataFactory.projetoComOrientador(10, TestDataFactory.orientador(1, orientadorUsuario));
        EtapaProgresso etapa = TestDataFactory.etapaProgresso(1, projeto, null, 1, 10, EtapaProgressoStatus.ACTIVE);

        when(authHelper.getCurrentUser()).thenReturn(orientadorUsuario);
        when(projetoRepository.findById(10)).thenReturn(Optional.of(projeto));
        when(etapaProgressoRepository.findByProjetoIdAndId(10, 1)).thenReturn(Optional.of(etapa));

        AdvanceProgressStepRequest request = new AdvanceProgressStepRequest();
        request.setStatus("done");

        etapaProgressoService.concluirEtapa(10, 1, request);

        verify(checklistService).aprovar(etapa, orientadorUsuario, null);
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
