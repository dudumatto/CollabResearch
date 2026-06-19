package com.example.tcc_backend.service;

import com.example.tcc_backend.dto.request.ProgressoRequest;
import com.example.tcc_backend.model.*;
import com.example.tcc_backend.repository.InscricaoRepository;
import com.example.tcc_backend.repository.ProgressoRepository;
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
class ProgressoServiceTest {

    @Mock
    private ProgressoRepository progressoRepository;
    @Mock
    private ProjetoRepository projetoRepository;
    @Mock
    private InscricaoRepository inscricaoRepository;
    @Mock
    private AuthHelper authHelper;
    @Mock
    private NotificacaoService notificacaoService;

    @InjectMocks
    private ProgressoService progressoService;

    @Test
    void criarDeveSalvarProgressoComAutorEEnviarNotificacao() {
        Usuario alunoUsuario = TestDataFactory.usuarioAluno(1);
        Usuario orientadorUsuario = TestDataFactory.usuarioOrientador(2);
        Orientador orientador = TestDataFactory.orientador(2, orientadorUsuario);
        Projeto projeto = TestDataFactory.projetoComOrientador(10, orientador);
        Aluno aluno = TestDataFactory.aluno(1, alunoUsuario);
        Inscricao inscricao = TestDataFactory.inscricaoAprovada(1, aluno, projeto);

        ProgressoRequest request = new ProgressoRequest();
        request.setDescricao("  Primeira entrega  ");

        when(authHelper.getCurrentUser()).thenReturn(alunoUsuario);
        when(projetoRepository.findById(10)).thenReturn(Optional.of(projeto));
        when(inscricaoRepository.findByProjetoIdAndAlunoUsuarioId(10, 1)).thenReturn(Optional.of(inscricao));
        when(progressoRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        Progresso progresso = progressoService.criar(10, request);

        assertThat(progresso.getAutor()).isEqualTo(alunoUsuario);
        assertThat(progresso.getDescricao()).isEqualTo("Primeira entrega");
        verify(notificacaoService).criarNotificacao(
                2,
                "Novo progresso registrado no projeto",
                TipoNotificacao.PROGRESSO_REGISTRADO
        );
    }

    @Test
    void atualizarDeveNegarQuandoUsuarioNaoForAutorNemDonoProjeto() {
        Usuario autor = TestDataFactory.usuarioAluno(1);
        Usuario outroUsuario = TestDataFactory.usuarioAluno(99);
        Projeto projeto = TestDataFactory.projetoComAlunoCriador(10, TestDataFactory.aluno(1, autor));
        Progresso progresso = TestDataFactory.progresso(5, projeto, autor);

        ProgressoRequest request = new ProgressoRequest();
        request.setDescricao("Nova descricao");

        when(authHelper.getCurrentUser()).thenReturn(outroUsuario);
        when(progressoRepository.findById(5)).thenReturn(Optional.of(progresso));

        assertThatThrownBy(() -> progressoService.atualizar(5, request))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(ex -> ((ResponseStatusException) ex).getStatusCode())
                .isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void listarPorProjetoDeveNegarQuandoUsuarioNaoParticipa() {
        Usuario outsider = TestDataFactory.usuarioAluno(99);
        Usuario orientadorUsuario = TestDataFactory.usuarioOrientador(2);
        Projeto projeto = TestDataFactory.projetoComOrientador(10, TestDataFactory.orientador(2, orientadorUsuario));

        when(authHelper.getCurrentUser()).thenReturn(outsider);
        when(projetoRepository.findById(10)).thenReturn(Optional.of(projeto));
        when(inscricaoRepository.findByProjetoIdAndAlunoUsuarioId(10, 99)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> progressoService.listarPorProjeto(10))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(ex -> ((ResponseStatusException) ex).getStatusCode())
                .isEqualTo(HttpStatus.FORBIDDEN);
    }
}
