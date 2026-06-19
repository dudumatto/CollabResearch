package com.example.tcc_backend.service;

import com.example.tcc_backend.model.*;
import com.example.tcc_backend.repository.ConversaRepository;
import com.example.tcc_backend.repository.InscricaoRepository;
import com.example.tcc_backend.repository.MensagemRepository;
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

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ConversaServiceTest {

    @Mock
    private ConversaRepository conversaRepository;
    @Mock
    private MensagemRepository mensagemRepository;
    @Mock
    private ProjetoRepository projetoRepository;
    @Mock
    private InscricaoRepository inscricaoRepository;
    @Mock
    private AuthHelper authHelper;
    @Mock
    private NotificacaoService notificacaoService;

    @InjectMocks
    private ConversaService conversaService;

    @Test
    void criarDeveSalvarConversaParaParticipanteDoProjeto() {
        Usuario usuario = TestDataFactory.usuarioAluno(1);
        Projeto projeto = TestDataFactory.projetoComAlunoCriador(10, TestDataFactory.aluno(1, usuario));
        Conversa conversa = TestDataFactory.conversa(5, projeto);

        when(authHelper.getCurrentUser()).thenReturn(usuario);
        when(projetoRepository.findById(10)).thenReturn(Optional.of(projeto));
        when(conversaRepository.save(any(Conversa.class))).thenReturn(conversa);

        Conversa criada = conversaService.criar(10);

        assertThat(criada.getId()).isEqualTo(5);
    }

    @Test
    void listarConversasDoUsuarioDeveNegarOutroUsuario() {
        when(authHelper.getCurrentUser()).thenReturn(TestDataFactory.usuarioAluno(1));

        assertThatThrownBy(() -> conversaService.listarConversasDoUsuario(2))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(ex -> ((ResponseStatusException) ex).getStatusCode())
                .isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void listarConversasDoUsuarioDeveUnirConversasDiretasEAprovadas() {
        Usuario usuario = TestDataFactory.usuarioAluno(1);
        Projeto projetoDireto = TestDataFactory.projetoComAlunoCriador(10, TestDataFactory.aluno(1, usuario));
        Projeto projetoAprovado = TestDataFactory.projetoComOrientador(11, TestDataFactory.orientador(2, TestDataFactory.usuarioOrientador(2)));
        Conversa conversaDireta = TestDataFactory.conversa(1, projetoDireto);
        Conversa conversaAprovada = TestDataFactory.conversa(2, projetoAprovado);
        Inscricao inscricao = TestDataFactory.inscricaoAprovada(5, TestDataFactory.aluno(1, usuario), projetoAprovado);

        when(authHelper.getCurrentUser()).thenReturn(usuario);
        when(inscricaoRepository.findByAlunoUsuarioIdAndStatus(1, StatusInscricao.APROVADO)).thenReturn(List.of(inscricao));
        when(projetoRepository.findByOrientadorUsuarioIdOrAlunoCriadorUsuarioId(1, 1)).thenReturn(List.of(projetoDireto));
        when(conversaRepository.findByProjetoIdIn(List.of(10, 11))).thenReturn(List.of(conversaDireta, conversaAprovada));

        List<Conversa> conversas = conversaService.listarConversasDoUsuario(1);

        assertThat(conversas).hasSize(2);
    }

    @Test
    void listarMensagensDeveNegarNaoParticipante() {
        Usuario outsider = TestDataFactory.usuarioAluno(9);
        Projeto projeto = TestDataFactory.projetoComAlunoCriador(10, TestDataFactory.aluno(1, TestDataFactory.usuarioAluno(1)));
        Conversa conversa = TestDataFactory.conversa(3, projeto);

        when(authHelper.getCurrentUser()).thenReturn(outsider);
        when(conversaRepository.findById(3)).thenReturn(Optional.of(conversa));
        when(inscricaoRepository.findByProjetoIdAndAlunoUsuarioId(10, 9)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> conversaService.listarMensagens(3))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(ex -> ((ResponseStatusException) ex).getStatusCode())
                .isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void enviarMensagemDeveSalvarENotificarOutrosParticipantes() {
        Usuario remetente = TestDataFactory.usuarioAluno(1);
        Usuario orientadorUsuario = TestDataFactory.usuarioOrientador(2);
        Usuario alunoCriadorUsuario = TestDataFactory.usuarioAluno(3);
        Projeto projeto = TestDataFactory.projetoComOrientador(10, TestDataFactory.orientador(2, orientadorUsuario));
        projeto.setAlunoCriador(TestDataFactory.aluno(3, alunoCriadorUsuario));
        when(inscricaoRepository.findByProjetoIdAndAlunoUsuarioId(10, 1)).thenReturn(Optional.of(
                TestDataFactory.inscricaoAprovada(7, TestDataFactory.aluno(1, remetente), projeto)
        ));
        Conversa conversa = TestDataFactory.conversa(5, projeto);
        Mensagem mensagem = TestDataFactory.mensagem(8, conversa, remetente);
        mensagem.setConteudo("Ola equipe");

        when(authHelper.getCurrentUser()).thenReturn(remetente);
        when(conversaRepository.findById(5)).thenReturn(Optional.of(conversa));
        when(mensagemRepository.save(any(Mensagem.class))).thenReturn(mensagem);

        Mensagem enviada = conversaService.enviarMensagem(5, "Ola equipe");

        assertThat(enviada.getConteudo()).isEqualTo("Ola equipe");
        verify(notificacaoService).criarNotificacao(
                2,
                "Nova mensagem em conversa do projeto",
                TipoNotificacao.MENSAGEM_RECEBIDA,
                "CONVERSA",
                5,
                "/conversas/5?mensagemId=8",
                "Projeto 10"
        );
        verify(notificacaoService).criarNotificacao(
                3,
                "Nova mensagem em conversa do projeto",
                TipoNotificacao.MENSAGEM_RECEBIDA,
                "CONVERSA",
                5,
                "/conversas/5?mensagemId=8",
                "Projeto 10"
        );
    }
}
