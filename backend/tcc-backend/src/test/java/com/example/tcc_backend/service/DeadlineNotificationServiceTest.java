package com.example.tcc_backend.service;

import com.example.tcc_backend.dto.response.DeadlineNotificationResult;
import com.example.tcc_backend.model.*;
import com.example.tcc_backend.repository.DeadlineNotificationLogRepository;
import com.example.tcc_backend.repository.EtapaProgressoRepository;
import com.example.tcc_backend.repository.InscricaoRepository;
import com.example.tcc_backend.support.TestDataFactory;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DeadlineNotificationServiceTest {

    @Mock
    private EtapaProgressoRepository etapaProgressoRepository;
    @Mock
    private InscricaoRepository inscricaoRepository;
    @Mock
    private DeadlineNotificationLogRepository logRepository;
    @Mock
    private NotificacaoService notificacaoService;

    @InjectMocks
    private DeadlineNotificationService deadlineNotificationService;

    private Projeto projetoComEquipe() {
        Usuario orientadorUsuario = TestDataFactory.usuarioOrientador(2);
        Orientador orientador = TestDataFactory.orientador(1, orientadorUsuario);
        Usuario alunoUsuario = TestDataFactory.usuarioAluno(1);
        Aluno aluno = TestDataFactory.aluno(1, alunoUsuario);

        return Projeto.builder()
                .id(10)
                .titulo("Projeto 10")
                .descricao("Descricao")
                .requisitos("Java")
                .vagas(2)
                .status(StatusProjeto.EM_ANDAMENTO)
                .orientador(orientador)
                .alunoCriador(aluno)
                .build();
    }

    private EtapaProgresso etapaComPrazo(Projeto projeto, OffsetDateTime prazo) {
        EtapaProgresso etapa = TestDataFactory.etapaProgresso(5, projeto, null, 1, 10, EtapaProgressoStatus.ACTIVE);
        etapa.setTitulo("Revisao bibliografica");
        etapa.setPrazo(prazo);
        return etapa;
    }

    @Test
    void deveCriarAlerta7DiasParaEquipeDoProjeto() {
        Projeto projeto = projetoComEquipe();
        OffsetDateTime prazo = OffsetDateTime.now(ZoneOffset.UTC).plusDays(7);
        EtapaProgresso etapa = etapaComPrazo(projeto, prazo);

        when(etapaProgressoRepository.findByPrazoIsNotNull()).thenReturn(List.of(etapa));
        when(inscricaoRepository.findByProjetoIdAndStatus(10, StatusInscricao.APROVADO)).thenReturn(List.of());
        when(logRepository.existsByEtapaIdAndUsuarioIdAndTipoAndDataReferencia(
                eq(5L), eq(1), eq(AlertaPrazo.DAYS_7), any(LocalDate.class))).thenReturn(false);
        when(logRepository.existsByEtapaIdAndUsuarioIdAndTipoAndDataReferencia(
                eq(5L), eq(2), eq(AlertaPrazo.DAYS_7), any(LocalDate.class))).thenReturn(false);

        DeadlineNotificationResult result = deadlineNotificationService.processarAlertasDePrazo();

        assertThat(result.getEtapasProcessadas()).isEqualTo(1);
        assertThat(result.getNotificacoesCriadas()).isEqualTo(2);
        assertThat(result.getDuplicadosIgnorados()).isZero();
        verify(notificacaoService).criarNotificacao(eq(1), any(), eq(TipoNotificacao.PRAZO_PROXIMO), eq("progress_step"), eq(5), any(), any());
        verify(notificacaoService).criarNotificacao(eq(2), any(), eq(TipoNotificacao.PRAZO_PROXIMO), eq("progress_step"), eq(5), any(), any());
    }

    @Test
    void naoDeveDuplicarAlertaJaEnviado() {
        Projeto projeto = projetoComEquipe();
        OffsetDateTime prazo = OffsetDateTime.now(ZoneOffset.UTC).plusDays(3);
        EtapaProgresso etapa = etapaComPrazo(projeto, prazo);

        when(etapaProgressoRepository.findByPrazoIsNotNull()).thenReturn(List.of(etapa));
        when(inscricaoRepository.findByProjetoIdAndStatus(10, StatusInscricao.APROVADO)).thenReturn(List.of());
        when(logRepository.existsByEtapaIdAndUsuarioIdAndTipoAndDataReferencia(
                eq(5L), eq(1), eq(AlertaPrazo.DAYS_3), any(LocalDate.class))).thenReturn(true);
        when(logRepository.existsByEtapaIdAndUsuarioIdAndTipoAndDataReferencia(
                eq(5L), eq(2), eq(AlertaPrazo.DAYS_3), any(LocalDate.class))).thenReturn(true);

        DeadlineNotificationResult result = deadlineNotificationService.processarAlertasDePrazo();

        assertThat(result.getNotificacoesCriadas()).isZero();
        assertThat(result.getDuplicadosIgnorados()).isEqualTo(2);
        verify(notificacaoService, never()).criarNotificacao(any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    void deveIgnorarEtapaConcluidaEMarcarAtraso() {
        Projeto projeto = projetoComEquipe();
        OffsetDateTime prazo = OffsetDateTime.now(ZoneOffset.UTC).minusDays(2);
        EtapaProgresso etapaConcluida = etapaComPrazo(projeto, prazo);
        etapaConcluida.setStatus(EtapaProgressoStatus.DONE);
        EtapaProgresso etapaAtrasada = etapaComPrazo(projeto, prazo);
        etapaAtrasada.setId(6);

        when(etapaProgressoRepository.findByPrazoIsNotNull()).thenReturn(List.of(etapaConcluida, etapaAtrasada));
        when(inscricaoRepository.findByProjetoIdAndStatus(10, StatusInscricao.APROVADO)).thenReturn(List.of());
        when(logRepository.existsByEtapaIdAndUsuarioIdAndTipoAndDataReferencia(
                eq(6L), eq(1), eq(AlertaPrazo.OVERDUE), any(LocalDate.class))).thenReturn(false);
        when(logRepository.existsByEtapaIdAndUsuarioIdAndTipoAndDataReferencia(
                eq(6L), eq(2), eq(AlertaPrazo.OVERDUE), any(LocalDate.class))).thenReturn(false);

        DeadlineNotificationResult result = deadlineNotificationService.processarAlertasDePrazo();

        assertThat(result.getEtapasProcessadas()).isEqualTo(1);
        assertThat(result.getNotificacoesCriadas()).isEqualTo(2);
        verify(notificacaoService).criarNotificacao(eq(1), any(), eq(TipoNotificacao.PRAZO_ATRASADO), any(), any(), any(), any());
        verify(notificacaoService).criarNotificacao(eq(2), any(), eq(TipoNotificacao.PRAZO_ATRASADO), any(), any(), any(), any());
    }

    @Test
    void deveRespeitarNotificacoesDesativadas() {
        Projeto projeto = projetoComEquipe();
        OffsetDateTime prazo = OffsetDateTime.now(ZoneOffset.UTC).plusDays(1);
        EtapaProgresso etapa = etapaComPrazo(projeto, prazo);
        projeto.getOrientador().getUsuario().setNotificacoesAtivas(false);
        projeto.getAlunoCriador().getUsuario().setNotificacoesAtivas(false);

        when(etapaProgressoRepository.findByPrazoIsNotNull()).thenReturn(List.of(etapa));
        when(inscricaoRepository.findByProjetoIdAndStatus(10, StatusInscricao.APROVADO)).thenReturn(List.of());

        DeadlineNotificationResult result = deadlineNotificationService.processarAlertasDePrazo();

        assertThat(result.getNotificacoesCriadas()).isZero();
        verify(notificacaoService, never()).criarNotificacao(any(), any(), any(), any(), any(), any(), any());
    }
}
