package com.example.tcc_backend.service;

import com.example.tcc_backend.model.Notificacao;
import com.example.tcc_backend.model.TipoNotificacao;
import com.example.tcc_backend.model.Usuario;
import com.example.tcc_backend.repository.NotificacaoRepository;
import com.example.tcc_backend.repository.UsuarioRepository;
import com.example.tcc_backend.security.AuthHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificacaoService {

    private final NotificacaoRepository notificacaoRepository;
    private final UsuarioRepository usuarioRepository;
    private final AuthHelper authHelper;

    public List<Notificacao> minhasNotificacoes() {
        Usuario usuarioLogado = authHelper.getCurrentUser();
        return notificacaoRepository.findByUsuarioIdOrderByDataCriacaoDesc(usuarioLogado.getId());
    }

    public Page<Notificacao> minhasNotificacoes(Pageable pageable) {
        Usuario usuarioLogado = authHelper.getCurrentUser();
        return notificacaoRepository.findByUsuarioIdOrderByDataCriacaoDesc(usuarioLogado.getId(), pageable);
    }

    public Notificacao marcarComoLida(Integer id) {
        Usuario usuarioLogado = authHelper.getCurrentUser();
        Notificacao notificacao = notificacaoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notificacao nao encontrada"));

        if (!notificacao.getUsuario().getId().equals(usuarioLogado.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Sem permissao para alterar esta notificacao");
        }

        notificacao.setLida(true);
        return notificacaoRepository.save(notificacao);
    }

    public void marcarTodasComoLidas() {
        Usuario usuarioLogado = authHelper.getCurrentUser();
        List<Notificacao> notificacoes = notificacaoRepository.findByUsuarioIdOrderByDataCriacaoDesc(usuarioLogado.getId());

        for (Notificacao notificacao : notificacoes) {
            if (!Boolean.TRUE.equals(notificacao.getLida())) {
                notificacao.setLida(true);
            }
        }
        notificacaoRepository.saveAll(notificacoes);
    }

    public void criarNotificacao(Integer usuarioId, String mensagem, TipoNotificacao tipo) {
        criarNotificacao(usuarioId, mensagem, tipo, null, null, rotaPadrao(tipo), null);
    }

    public void criarNotificacao(Integer usuarioId,
                                 String mensagem,
                                 TipoNotificacao tipo,
                                 String entidadeRelacionada,
                                 Integer entidadeId,
                                 String rotaSugerida,
                                 String payloadResumo) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario nao encontrado"));

        Notificacao notificacao = Notificacao.builder()
                .usuario(usuario)
                .mensagem(mensagem)
                .tipo(tipo)
                .entidadeRelacionada(entidadeRelacionada)
                .entidadeId(entidadeId)
                .rotaSugerida(rotaSugerida != null ? rotaSugerida : rotaPadrao(tipo))
                .payloadResumo(payloadResumo)
                .build();
        notificacaoRepository.save(notificacao);
    }

    public long contarNaoLidas(Integer usuarioId) {
        return notificacaoRepository.countByUsuarioIdAndLidaFalse(usuarioId);
    }

    private String rotaPadrao(TipoNotificacao tipo) {
        return switch (tipo) {
            case SOLICITACAO_ORIENTACAO -> "/app/projects?status=PENDENTE_ORIENTADOR";
            case PROJETO_ACEITO, PROJETO_REJEITADO -> "/app/projects";
            case INSCRICAO_RECEBIDA -> "/app/projects";
            case INSCRICAO_APROVADA, INSCRICAO_REJEITADA -> "/app/applications";
            case MENSAGEM_RECEBIDA -> "/app/chat";
            case PROGRESSO_REGISTRADO -> "/app/projects";
        };
    }
}
