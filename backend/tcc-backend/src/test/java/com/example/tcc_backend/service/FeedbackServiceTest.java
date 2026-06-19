package com.example.tcc_backend.service;

import com.example.tcc_backend.dto.request.FeedbackRequest;
import com.example.tcc_backend.model.*;
import com.example.tcc_backend.repository.FeedbackRepository;
import com.example.tcc_backend.repository.InscricaoRepository;
import com.example.tcc_backend.repository.ProjetoRepository;
import com.example.tcc_backend.security.AuthHelper;
import com.example.tcc_backend.support.TestDataFactory;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FeedbackServiceTest {

    @Mock
    private FeedbackRepository feedbackRepository;
    @Mock
    private ProjetoRepository projetoRepository;
    @Mock
    private InscricaoRepository inscricaoRepository;
    @Mock
    private AuthHelper authHelper;

    @InjectMocks
    private FeedbackService feedbackService;

    @Test
    void criarDeveSalvarFeedbackParaAlunoAprovado() {
        Usuario alunoUsuario = TestDataFactory.usuarioAluno(1);
        Orientador orientador = TestDataFactory.orientador(2, TestDataFactory.usuarioOrientador(2));
        Projeto projeto = TestDataFactory.projetoComOrientador(10, orientador);
        Aluno aluno = TestDataFactory.aluno(1, alunoUsuario);
        Inscricao inscricao = TestDataFactory.inscricaoAprovada(1, aluno, projeto);

        FeedbackRequest request = new FeedbackRequest();
        request.setProjetoId(10);
        request.setNota(5);
        request.setComentario("  Excelente orientacao  ");

        when(authHelper.getCurrentUser()).thenReturn(alunoUsuario);
        when(projetoRepository.findById(10)).thenReturn(Optional.of(projeto));
        when(inscricaoRepository.findByProjetoIdAndAlunoUsuarioId(10, 1)).thenReturn(Optional.of(inscricao));
        when(feedbackRepository.existsByProjetoIdAndAvaliadorId(10, 1)).thenReturn(false);
        when(feedbackRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        Feedback feedback = feedbackService.criar(request);

        assertThat(feedback.getComentario()).isEqualTo("Excelente orientacao");
        assertThat(feedback.getNota()).isEqualTo(5);
        assertThat(feedback.getAvaliador()).isEqualTo(alunoUsuario);
        verify(feedbackRepository).save(any());
    }

    @Test
    void criarDeveNegarQuandoUsuarioNaoForAluno() {
        Usuario orientadorUsuario = TestDataFactory.usuarioOrientador(2);
        Projeto projeto = TestDataFactory.projetoComOrientador(10, TestDataFactory.orientador(2, orientadorUsuario));
        FeedbackRequest request = new FeedbackRequest();
        request.setProjetoId(10);
        request.setNota(4);

        when(authHelper.getCurrentUser()).thenReturn(orientadorUsuario);
        when(projetoRepository.findById(10)).thenReturn(Optional.of(projeto));

        assertThatThrownBy(() -> feedbackService.criar(request))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(ex -> ((ResponseStatusException) ex).getStatusCode())
                .isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void criarDeveNegarQuandoFeedbackJaExiste() {
        Usuario alunoUsuario = TestDataFactory.usuarioAluno(1);
        Orientador orientador = TestDataFactory.orientador(2, TestDataFactory.usuarioOrientador(2));
        Projeto projeto = TestDataFactory.projetoComOrientador(10, orientador);
        Aluno aluno = TestDataFactory.aluno(1, alunoUsuario);
        Inscricao inscricao = TestDataFactory.inscricaoAprovada(1, aluno, projeto);
        FeedbackRequest request = new FeedbackRequest();
        request.setProjetoId(10);
        request.setNota(4);

        when(authHelper.getCurrentUser()).thenReturn(alunoUsuario);
        when(projetoRepository.findById(10)).thenReturn(Optional.of(projeto));
        when(inscricaoRepository.findByProjetoIdAndAlunoUsuarioId(10, 1)).thenReturn(Optional.of(inscricao));
        when(feedbackRepository.existsByProjetoIdAndAvaliadorId(10, 1)).thenReturn(true);

        assertThatThrownBy(() -> feedbackService.criar(request))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(ex -> ((ResponseStatusException) ex).getStatusCode())
                .isEqualTo(HttpStatus.CONFLICT);
    }
}
