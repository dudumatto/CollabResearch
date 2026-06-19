package com.example.tcc_backend.service;

import com.example.tcc_backend.model.Notificacao;
import com.example.tcc_backend.model.TipoNotificacao;
import com.example.tcc_backend.model.Usuario;
import com.example.tcc_backend.repository.NotificacaoRepository;
import com.example.tcc_backend.repository.UsuarioRepository;
import com.example.tcc_backend.security.AuthHelper;
import com.example.tcc_backend.support.TestDataFactory;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
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
class NotificacaoServiceTest {

    @Mock
    private NotificacaoRepository notificacaoRepository;
    @Mock
    private UsuarioRepository usuarioRepository;
    @Mock
    private AuthHelper authHelper;

    @InjectMocks
    private NotificacaoService notificacaoService;

    @Test
    void minhasNotificacoesDeveBuscarDoUsuarioLogado() {
        Usuario usuario = TestDataFactory.usuarioAluno(1);
        when(authHelper.getCurrentUser()).thenReturn(usuario);
        when(notificacaoRepository.findByUsuarioIdOrderByDataCriacaoDesc(1)).thenReturn(List.of(TestDataFactory.notificacao(1, usuario)));

        List<Notificacao> notificacoes = notificacaoService.minhasNotificacoes();

        assertThat(notificacoes).hasSize(1);
    }

    @Test
    void marcarComoLidaDeveNegarQuandoNotificacaoForDeOutroUsuario() {
        Usuario usuario = TestDataFactory.usuarioAluno(1);
        Notificacao notificacao = TestDataFactory.notificacao(2, TestDataFactory.usuarioAluno(3));

        when(authHelper.getCurrentUser()).thenReturn(usuario);
        when(notificacaoRepository.findById(2)).thenReturn(Optional.of(notificacao));

        assertThatThrownBy(() -> notificacaoService.marcarComoLida(2))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(ex -> ((ResponseStatusException) ex).getStatusCode())
                .isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void marcarTodasComoLidasDeveAtualizarLista() {
        Usuario usuario = TestDataFactory.usuarioAluno(1);
        Notificacao n1 = TestDataFactory.notificacao(1, usuario);
        Notificacao n2 = TestDataFactory.notificacao(2, usuario);
        n2.setLida(true);

        when(authHelper.getCurrentUser()).thenReturn(usuario);
        when(notificacaoRepository.findByUsuarioIdOrderByDataCriacaoDesc(1)).thenReturn(List.of(n1, n2));

        notificacaoService.marcarTodasComoLidas();

        assertThat(n1.getLida()).isTrue();
        assertThat(n2.getLida()).isTrue();
        verify(notificacaoRepository).saveAll(List.of(n1, n2));
    }

    @Test
    void criarNotificacaoDeveMontarEntidadeESalvar() {
        Usuario usuario = TestDataFactory.usuarioAluno(1);
        when(usuarioRepository.findById(1)).thenReturn(Optional.of(usuario));

        notificacaoService.criarNotificacao(1, "Mensagem", TipoNotificacao.MENSAGEM_RECEBIDA);

        ArgumentCaptor<Notificacao> captor = ArgumentCaptor.forClass(Notificacao.class);
        verify(notificacaoRepository).save(captor.capture());
        assertThat(captor.getValue().getMensagem()).isEqualTo("Mensagem");
        assertThat(captor.getValue().getTipo()).isEqualTo(TipoNotificacao.MENSAGEM_RECEBIDA);
        assertThat(captor.getValue().getRotaSugerida()).isEqualTo("/app/chat");
    }
}
