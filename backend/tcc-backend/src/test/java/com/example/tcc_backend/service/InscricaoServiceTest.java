package com.example.tcc_backend.service;

import com.example.tcc_backend.dto.request.InscricaoRequest;
import com.example.tcc_backend.model.*;
import com.example.tcc_backend.repository.AlunoRepository;
import com.example.tcc_backend.repository.InscricaoRepository;
import com.example.tcc_backend.repository.ProjetoRepository;
import com.example.tcc_backend.security.AuthHelper;
import com.example.tcc_backend.security.ProjectAccessPolicy;
import com.example.tcc_backend.support.TestDataFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InscricaoServiceTest {

    @Mock
    private InscricaoRepository inscricaoRepository;
    @Mock
    private AlunoRepository alunoRepository;
    @Mock
    private ProjetoRepository projetoRepository;
    @Mock
    private AuthHelper authHelper;
    private ProjectAccessPolicy projectAccessPolicy;
    @Mock
    private NotificacaoService notificacaoService;

    private InscricaoService inscricaoService;

    @BeforeEach
    void setUp() {
        projectAccessPolicy = new ProjectAccessPolicy(inscricaoRepository);
        inscricaoService = new InscricaoService(
                inscricaoRepository, alunoRepository, projetoRepository,
                authHelper, notificacaoService, projectAccessPolicy);
    }

    @Test
    void findAllDeveRetornarSomenteInscricoesDoAluno() {
        Usuario aluno = TestDataFactory.usuarioAluno(1);
        Inscricao inscricao = TestDataFactory.inscricaoAprovada(
                5, TestDataFactory.aluno(1, aluno), TestDataFactory.projetoComAlunoCriador(10, TestDataFactory.aluno(1, aluno)));
        when(authHelper.getCurrentUser()).thenReturn(aluno);
        when(inscricaoRepository.findByAlunoUsuarioId(1)).thenReturn(List.of(inscricao));

        assertThat(inscricaoService.findAll()).containsExactly(inscricao);
        verify(inscricaoRepository, never()).findAll();
    }

    @Test
    void findAllDeveRetornarProjetosDoOrientador() {
        Usuario orientador = TestDataFactory.usuarioOrientador(2);
        when(authHelper.getCurrentUser()).thenReturn(orientador);
        when(inscricaoRepository.findByProjetoOrientadorUsuarioId(2)).thenReturn(List.of());

        assertThat(inscricaoService.findAll()).isEmpty();
        verify(inscricaoRepository).findByProjetoOrientadorUsuarioId(2);
    }

    @Test
    void findAllDevePermitirAuditoriaDoAdmin() {
        when(authHelper.getCurrentUser()).thenReturn(TestDataFactory.usuarioAdmin(8));
        when(inscricaoRepository.findAll()).thenReturn(List.of());

        assertThat(inscricaoService.findAll()).isEmpty();
        verify(inscricaoRepository).findAll();
    }

    @Test
    void findAllPaginadoDeveEscoparOrientador() {
        Usuario orientador = TestDataFactory.usuarioOrientador(2);
        PageRequest pageable = PageRequest.of(0, 10);
        when(authHelper.getCurrentUser()).thenReturn(orientador);
        when(inscricaoRepository.findByProjetoOrientadorUsuarioId(2, pageable))
                .thenReturn(new PageImpl<>(List.of(), pageable, 0));

        assertThat(inscricaoService.findAll(pageable)).isEmpty();
        verify(inscricaoRepository).findByProjetoOrientadorUsuarioId(2, pageable);
    }

    @Test
    void findByProjetoDeveNegarAlunoExterno() {
        Usuario externo = TestDataFactory.usuarioAluno(9);
        Projeto projeto = TestDataFactory.projetoComOrientador(
                10, TestDataFactory.orientador(2, TestDataFactory.usuarioOrientador(2)));
        when(authHelper.getCurrentUser()).thenReturn(externo);
        when(projetoRepository.findById(10)).thenReturn(Optional.of(projeto));

        assertThatThrownBy(() -> inscricaoService.findByProjeto(10))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(ex -> ((ResponseStatusException) ex).getStatusCode())
                .isEqualTo(HttpStatus.FORBIDDEN);
        verify(inscricaoRepository, never()).findByProjetoId(10);
    }

    @Test
    void findByIdDevePermitirPropriaInscricao() {
        Usuario aluno = TestDataFactory.usuarioAluno(1);
        Inscricao inscricao = TestDataFactory.inscricaoAprovada(
                5, TestDataFactory.aluno(1, aluno), TestDataFactory.projetoComAlunoCriador(10, TestDataFactory.aluno(1, aluno)));
        when(authHelper.getCurrentUser()).thenReturn(aluno);
        when(inscricaoRepository.findById(5)).thenReturn(Optional.of(inscricao));

        assertThat(inscricaoService.findById(5)).isSameAs(inscricao);
    }
    @Test
    void createDeveSalvarInscricaoENotificarOrientador() {
        Usuario alunoUsuario = TestDataFactory.usuarioAluno(1);
        Aluno aluno = TestDataFactory.aluno(1, alunoUsuario);
        Usuario orientadorUsuario = TestDataFactory.usuarioOrientador(2);
        Projeto projeto = TestDataFactory.projetoComOrientador(10, TestDataFactory.orientador(2, orientadorUsuario));
        InscricaoRequest request = InscricaoRequest.builder().projetoId(10).build();

        when(authHelper.getCurrentUser()).thenReturn(alunoUsuario);
        when(alunoRepository.findByUsuarioId(1)).thenReturn(Optional.of(aluno));
        when(projetoRepository.findById(10)).thenReturn(Optional.of(projeto));
        when(inscricaoRepository.existsByAlunoIdAndProjetoId(1, 10)).thenReturn(false);
        when(inscricaoRepository.save(any(Inscricao.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Inscricao inscricao = inscricaoService.create(request);

        assertThat(inscricao.getAluno()).isEqualTo(aluno);
        verify(notificacaoService).criarNotificacao(
                2,
                "Nova inscricao recebida no projeto Projeto 10",
                TipoNotificacao.INSCRICAO_RECEBIDA,
                "INSCRICAO",
                null,
                "/app/projects/10/applications",
                "Projeto 10"
        );
    }

    @Test
    void createDeveNegarQuandoUsuarioNaoForAluno() {
        when(authHelper.getCurrentUser()).thenReturn(TestDataFactory.usuarioOrientador(2));

        assertThatThrownBy(() -> inscricaoService.create(InscricaoRequest.builder().projetoId(10).build()))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(ex -> ((ResponseStatusException) ex).getStatusCode())
                .isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void createDeveTraduzirViolacaoDeIntegridadeEmConflito() {
        Usuario alunoUsuario = TestDataFactory.usuarioAluno(1);
        Aluno aluno = TestDataFactory.aluno(1, alunoUsuario);
        Projeto projeto = TestDataFactory.projetoComOrientador(10, TestDataFactory.orientador(2, TestDataFactory.usuarioOrientador(2)));

        when(authHelper.getCurrentUser()).thenReturn(alunoUsuario);
        when(alunoRepository.findByUsuarioId(1)).thenReturn(Optional.of(aluno));
        when(projetoRepository.findById(10)).thenReturn(Optional.of(projeto));
        when(inscricaoRepository.existsByAlunoIdAndProjetoId(1, 10)).thenReturn(false);
        when(inscricaoRepository.save(any(Inscricao.class))).thenThrow(new DataIntegrityViolationException("duplicado"));

        assertThatThrownBy(() -> inscricaoService.create(InscricaoRequest.builder().projetoId(10).build()))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(ex -> ((ResponseStatusException) ex).getStatusCode())
                .isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    void aprovarDeveAtualizarStatusENotificarAluno() {
        Usuario orientadorUsuario = TestDataFactory.usuarioOrientador(2);
        Usuario alunoUsuario = TestDataFactory.usuarioAluno(1);
        Projeto projeto = TestDataFactory.projetoComOrientador(10, TestDataFactory.orientador(2, orientadorUsuario));
        Inscricao inscricao = TestDataFactory.inscricaoAprovada(5, TestDataFactory.aluno(1, alunoUsuario), projeto);
        inscricao.setStatus(StatusInscricao.PENDENTE);

        when(authHelper.getCurrentUser()).thenReturn(orientadorUsuario);
        when(inscricaoRepository.findProjetoIdById(5)).thenReturn(Optional.of(10));
        when(projetoRepository.findByIdForUpdate(10)).thenReturn(Optional.of(projeto));
        when(inscricaoRepository.findByIdForUpdate(5)).thenReturn(Optional.of(inscricao));
        when(inscricaoRepository.countByProjetoIdAndStatus(10, StatusInscricao.APROVADO)).thenReturn(0L);
        when(inscricaoRepository.save(any(Inscricao.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Inscricao aprovada = inscricaoService.aprovar(5);

        assertThat(aprovada.getStatus()).isEqualTo(StatusInscricao.APROVADO);
        verify(notificacaoService).criarNotificacao(
                1,
                "Sua inscricao foi aprovada",
                TipoNotificacao.INSCRICAO_APROVADA,
                "INSCRICAO",
                5,
                "/app/applications",
                "Projeto 10"
        );
    }

    @Test
    void aprovarDeveNegarOrientadorDeOutroProjeto() {
        Usuario outroOrientador = TestDataFactory.usuarioOrientador(9);
        Usuario alunoUsuario = TestDataFactory.usuarioAluno(1);
        Projeto projeto = TestDataFactory.projetoComOrientador(10, TestDataFactory.orientador(2, TestDataFactory.usuarioOrientador(2)));
        Inscricao inscricao = TestDataFactory.inscricaoAprovada(5, TestDataFactory.aluno(1, alunoUsuario), projeto);

        when(authHelper.getCurrentUser()).thenReturn(outroOrientador);
        when(inscricaoRepository.findProjetoIdById(5)).thenReturn(Optional.of(10));
        when(projetoRepository.findByIdForUpdate(10)).thenReturn(Optional.of(projeto));
        when(inscricaoRepository.findByIdForUpdate(5)).thenReturn(Optional.of(inscricao));

        assertThatThrownBy(() -> inscricaoService.aprovar(5))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(ex -> ((ResponseStatusException) ex).getStatusCode())
                .isEqualTo(HttpStatus.FORBIDDEN);

        verify(inscricaoRepository, never()).save(any(Inscricao.class));
    }

    @Test
    void rejeitarDeveAtualizarStatusENotificarAluno() {
        Usuario orientadorUsuario = TestDataFactory.usuarioOrientador(2);
        Usuario alunoUsuario = TestDataFactory.usuarioAluno(1);
        Projeto projeto = TestDataFactory.projetoComOrientador(10, TestDataFactory.orientador(2, orientadorUsuario));
        Inscricao inscricao = TestDataFactory.inscricaoAprovada(5, TestDataFactory.aluno(1, alunoUsuario), projeto);
        inscricao.setStatus(StatusInscricao.PENDENTE);

        when(authHelper.getCurrentUser()).thenReturn(orientadorUsuario);
        when(inscricaoRepository.findProjetoIdById(5)).thenReturn(Optional.of(10));
        when(projetoRepository.findByIdForUpdate(10)).thenReturn(Optional.of(projeto));
        when(inscricaoRepository.findByIdForUpdate(5)).thenReturn(Optional.of(inscricao));
        when(inscricaoRepository.save(any(Inscricao.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Inscricao rejeitada = inscricaoService.rejeitar(5);

        assertThat(rejeitada.getStatus()).isEqualTo(StatusInscricao.REJEITADO);
        verify(notificacaoService).criarNotificacao(
                1,
                "Sua inscricao foi rejeitada",
                TipoNotificacao.INSCRICAO_REJEITADA,
                "INSCRICAO",
                5,
                "/app/applications",
                "Projeto 10"
        );
    }

    @Test
    void cancelDeveNegarQuandoNaoForODono() {
        Usuario alunoUsuario = TestDataFactory.usuarioAluno(1);
        Usuario outroUsuario = TestDataFactory.usuarioAluno(9);
        Inscricao inscricao = TestDataFactory.inscricaoAprovada(
                5,
                TestDataFactory.aluno(1, alunoUsuario),
                TestDataFactory.projetoComOrientador(10, TestDataFactory.orientador(2, TestDataFactory.usuarioOrientador(2)))
        );

        when(authHelper.getCurrentUser()).thenReturn(outroUsuario);
        when(inscricaoRepository.findById(5)).thenReturn(Optional.of(inscricao));

        assertThatThrownBy(() -> inscricaoService.cancel(5))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(ex -> ((ResponseStatusException) ex).getStatusCode())
                .isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void updateDeveNegarTrocaDeProjetoMesmoParaInscricaoAprovadaDoProprioAluno() {
        Usuario alunoUsuario = TestDataFactory.usuarioAluno(1);
        Projeto projetoAtual = TestDataFactory.projetoComOrientador(10, TestDataFactory.orientador(2, TestDataFactory.usuarioOrientador(2)));
        Inscricao inscricao = TestDataFactory.inscricaoAprovada(5, TestDataFactory.aluno(1, alunoUsuario), projetoAtual);

        when(authHelper.getCurrentUser()).thenReturn(alunoUsuario);
        when(inscricaoRepository.findByIdForUpdate(5)).thenReturn(Optional.of(inscricao));

        assertThatThrownBy(() -> inscricaoService.update(5, InscricaoRequest.builder().projetoId(11).build()))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(ex -> ((ResponseStatusException) ex).getStatusCode())
                .isEqualTo(HttpStatus.CONFLICT);
        verify(inscricaoRepository, never()).save(any(Inscricao.class));
    }

    @Test
    void updateDeveAlterarSomenteMotivacaoNoMesmoProjeto() {
        Usuario alunoUsuario = TestDataFactory.usuarioAluno(1);
        Projeto projeto = TestDataFactory.projetoComOrientador(10, TestDataFactory.orientador(2, TestDataFactory.usuarioOrientador(2)));
        Inscricao inscricao = TestDataFactory.inscricaoAprovada(5, TestDataFactory.aluno(1, alunoUsuario), projeto);

        when(authHelper.getCurrentUser()).thenReturn(alunoUsuario);
        when(inscricaoRepository.findByIdForUpdate(5)).thenReturn(Optional.of(inscricao));
        when(inscricaoRepository.save(any(Inscricao.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Inscricao atualizada = inscricaoService.update(
                5, InscricaoRequest.builder().projetoId(10).motivacao("  Nova motivacao  ").build());

        assertThat(atualizada.getMotivacao()).isEqualTo("Nova motivacao");
        assertThat(atualizada.getProjeto()).isSameAs(projeto);
    }

    @Test
    void findByUsuarioLogadoDeveRetornarInscricoesDoAluno() {
        Usuario alunoUsuario = TestDataFactory.usuarioAluno(1);
        Inscricao inscricao = TestDataFactory.inscricaoAprovada(
                5,
                TestDataFactory.aluno(1, alunoUsuario),
                TestDataFactory.projetoComOrientador(10, TestDataFactory.orientador(2, TestDataFactory.usuarioOrientador(2)))
        );

        when(authHelper.getCurrentUser()).thenReturn(alunoUsuario);
        when(inscricaoRepository.findByAlunoUsuarioId(1)).thenReturn(List.of(inscricao));

        assertThat(inscricaoService.findByUsuarioLogado()).containsExactly(inscricao);
    }

    @Test
    void findByUsuarioLogadoDeveRetornarListaVaziaParaOrientador() {
        when(authHelper.getCurrentUser()).thenReturn(TestDataFactory.usuarioOrientador(2));

        assertThat(inscricaoService.findByUsuarioLogado()).isEmpty();
    }

    @Test
    void aprovarDeveNegarProjetoSemVagas() {
        Usuario orientador = TestDataFactory.usuarioOrientador(2);
        Projeto projeto = TestDataFactory.projetoComOrientador(10, TestDataFactory.orientador(2, orientador));
        Usuario alunoUsuario = TestDataFactory.usuarioAluno(1);
        Inscricao inscricao = TestDataFactory.inscricaoAprovada(5, TestDataFactory.aluno(1, alunoUsuario), projeto);
        inscricao.setStatus(StatusInscricao.PENDENTE);
        when(authHelper.getCurrentUser()).thenReturn(orientador);
        when(inscricaoRepository.findProjetoIdById(5)).thenReturn(Optional.of(10));
        when(projetoRepository.findByIdForUpdate(10)).thenReturn(Optional.of(projeto));
        when(inscricaoRepository.findByIdForUpdate(5)).thenReturn(Optional.of(inscricao));
        when(inscricaoRepository.countByProjetoIdAndStatus(10, StatusInscricao.APROVADO)).thenReturn(1L);

        assertThatThrownBy(() -> inscricaoService.aprovar(5))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(ex -> ((ResponseStatusException) ex).getStatusCode())
                .isEqualTo(HttpStatus.CONFLICT);
        verify(projetoRepository).findByIdForUpdate(10);
        verify(inscricaoRepository, never()).save(inscricao);
    }}
