package com.example.tcc_backend.service;

import com.example.tcc_backend.dto.response.MensagemResponse;
import com.example.tcc_backend.model.*;
import com.example.tcc_backend.repository.*;
import com.example.tcc_backend.security.AuthHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ConversaService {

    private final ConversaRepository conversaRepository;
    private final MensagemRepository mensagemRepository;
    private final ProjetoRepository projetoRepository;
    private final InscricaoRepository inscricaoRepository;
    private final UsuarioRepository usuarioRepository;
    private final AuthHelper authHelper;
    private final NotificacaoService notificacaoService;
    private final ChatRealtimeService chatRealtimeService;

    public Conversa criar(Integer projetoId) {
        return abrirOuCriarPorProjeto(projetoId);
    }

    public Conversa abrirOuCriarPorProjeto(Integer projetoId) {
        Usuario usuarioLogado = authHelper.getCurrentUser();
        Projeto projeto = projetoRepository.findById(projetoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Projeto nao encontrado"));
        validarParticipacaoProjeto(projeto, usuarioLogado.getId());

        return conversaRepository.findByProjetoId(projetoId)
                .orElseGet(() -> conversaRepository.save(
                        Conversa.builder()
                                .projeto(projeto)
                                .tipo(TipoConversa.GRUPO)
                                .build()
                ));
    }

    public Conversa buscarPorProjeto(Integer projetoId) {
        Usuario usuarioLogado = authHelper.getCurrentUser();
        Projeto projeto = projetoRepository.findById(projetoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Projeto nao encontrado"));
        validarParticipacaoProjeto(projeto, usuarioLogado.getId());
        return conversaRepository.findByProjetoId(projetoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Conversa nao encontrada para este projeto"));
    }

    public Conversa abrirOuCriarPrivada(Integer outroUsuarioId) {
        Usuario usuarioLogado = authHelper.getCurrentUser();

        if (usuarioLogado.getId().equals(outroUsuarioId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nao e possivel criar conversa consigo mesmo");
        }

        Usuario outroUsuario = usuarioRepository.findById(outroUsuarioId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario nao encontrado"));

        // Verifica nos dois sentidos
        Optional<Conversa> existente = conversaRepository
                .findPrivadaEntreUsuarios(usuarioLogado.getId(), outroUsuarioId);

        if (existente.isEmpty()) {
            existente = conversaRepository
                    .findPrivadaEntreUsuarios(outroUsuarioId, usuarioLogado.getId());
        }

        if (existente.isPresent()) return existente.get();

        Conversa nova = Conversa.builder()
                .tipo(TipoConversa.PRIVADA)
                .participantes(new ArrayList<>(List.of(usuarioLogado, outroUsuario)))
                .build();

        return conversaRepository.save(nova);
    }

    public List<Conversa> listarConversasDoUsuario(Integer usuarioId) {
        Usuario usuarioLogado = authHelper.getCurrentUser();
        if (usuarioLogado == null || usuarioLogado.getId() == null || !usuarioLogado.getId().equals(usuarioId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Sem permissao para listar conversas de outro usuario");
        }

        Set<Projeto> projetos = new LinkedHashSet<>();

        projetos.addAll(
                projetoRepository.findByOrientadorUsuarioIdOrAlunoCriadorUsuarioId(usuarioId, usuarioId)
        );

        List<Inscricao> inscricoes = inscricaoRepository
                .findByAlunoUsuarioIdAndStatus(usuarioId, StatusInscricao.APROVADO);

        for (Inscricao i : inscricoes) {
            projetos.add(i.getProjeto());
        }

        return conversaRepository.findByProjetoIdIn(
                projetos.stream().map(Projeto::getId).toList()
        );
    }

    public Page<Conversa> listarConversasDoUsuario(Integer usuarioId, Pageable pageable) {
        Usuario usuarioLogado = authHelper.getCurrentUser();
        if (!usuarioLogado.getId().equals(usuarioId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Sem permissao para listar conversas de outro usuario");
        }
        return conversaRepository.findByProjetoOrientadorUsuarioIdOrProjetoAlunoCriadorUsuarioId(
                usuarioId, usuarioId, pageable);
    }

    public List<Conversa> listarTodasConversasDoUsuario(Integer usuarioId) {
        Usuario usuarioLogado = authHelper.getCurrentUser();
        if (!usuarioLogado.getId().equals(usuarioId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Sem permissao para listar conversas de outro usuario");
        }

        List<Conversa> todas = new ArrayList<>();
        todas.addAll(listarConversasDoUsuario(usuarioId));
        todas.addAll(conversaRepository.findPrivadasDoUsuario(usuarioId));

        return todas;
    }

    public List<Mensagem> listarMensagens(Integer conversaId) {
        Usuario usuarioLogado = authHelper.getCurrentUser();
        Conversa conversa = conversaRepository.findById(conversaId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Conversa nao encontrada"));
        validarParticipacao(conversa, usuarioLogado.getId());
        return mensagemRepository.findByConversaIdOrderByDataEnvioAsc(conversaId);
    }

    public Page<Mensagem> listarMensagens(Integer conversaId, Pageable pageable) {
        Usuario usuarioLogado = authHelper.getCurrentUser();
        Conversa conversa = conversaRepository.findById(conversaId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Conversa nao encontrada"));
        validarParticipacao(conversa, usuarioLogado.getId());
        return mensagemRepository.findByConversaIdOrderByDataEnvioAsc(conversaId, pageable);
    }

    public Mensagem enviarMensagem(Integer conversaId, String conteudo) {
        Usuario usuarioLogado = authHelper.getCurrentUser();
        Conversa conversa = conversaRepository.findById(conversaId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Conversa nao encontrada"));
        validarParticipacao(conversa, usuarioLogado.getId());

        Mensagem mensagem = Mensagem.builder()
                .conversa(conversa)
                .remetente(usuarioLogado)
                .conteudo(conteudo)
                .build();
        Mensagem salva = mensagemRepository.save(mensagem);
        String rotaMensagem = "/conversas/" + conversa.getId() + "?mensagemId=" + salva.getId();

        if (conversa.getTipo() == TipoConversa.PRIVADA) {
            // Notifica o outro participante
            conversa.getParticipantes().stream()
                    .filter(p -> !p.getId().equals(usuarioLogado.getId()))
                    .forEach(p -> notificacaoService.criarNotificacao(
                            p.getId(),
                            "Nova mensagem de " + usuarioLogado.getNome(),
                            TipoNotificacao.MENSAGEM_RECEBIDA,
                            "CONVERSA",
                            conversa.getId(),
                            rotaMensagem,
                            usuarioLogado.getNome()
                    ));
        } else {
            Projeto projeto = conversa.getProjeto();

            if (projeto.getOrientador() != null) {
                Integer orientadorUsuarioId = projeto.getOrientador().getUsuario().getId();
                if (!orientadorUsuarioId.equals(usuarioLogado.getId())) {
                    notificacaoService.criarNotificacao(
                            orientadorUsuarioId,
                            "Nova mensagem em conversa do projeto",
                            TipoNotificacao.MENSAGEM_RECEBIDA,
                            "CONVERSA",
                            conversa.getId(),
                            rotaMensagem,
                            projeto.getTitulo()
                    );
                }
            }
            if (projeto.getAlunoCriador() != null) {
                Integer alunoCriadorUsuarioId = projeto.getAlunoCriador().getUsuario().getId();
                if (!alunoCriadorUsuarioId.equals(usuarioLogado.getId())) {
                    notificacaoService.criarNotificacao(
                            alunoCriadorUsuarioId,
                            "Nova mensagem em conversa do projeto",
                            TipoNotificacao.MENSAGEM_RECEBIDA,
                            "CONVERSA",
                            conversa.getId(),
                            rotaMensagem,
                            projeto.getTitulo()
                    );
                }
            }
        }

        chatRealtimeService.publicarMensagemCriada(salva);
        return salva;
    }

    private void validarParticipacao(Conversa conversa, Integer usuarioId) {
        if (conversa.getTipo() == TipoConversa.PRIVADA) {
            boolean participa = conversa.getParticipantes()
                    .stream().anyMatch(p -> p.getId().equals(usuarioId));
            if (!participa) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Usuario nao participa desta conversa");
            }
            return;
        }
        validarParticipacaoProjeto(conversa.getProjeto(), usuarioId);
    }

    private void validarParticipacaoProjeto(Projeto projeto, Integer usuarioId) {
        boolean donoProjeto = (projeto.getOrientador() != null && projeto.getOrientador().getUsuario().getId().equals(usuarioId))
                || (projeto.getAlunoCriador() != null && projeto.getAlunoCriador().getUsuario().getId().equals(usuarioId));

        if (donoProjeto) return;

        Inscricao inscricao = inscricaoRepository.findByProjetoIdAndAlunoUsuarioId(projeto.getId(), usuarioId).orElse(null);
        if (inscricao == null || inscricao.getStatus() != StatusInscricao.APROVADO) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Usuario nao participa deste projeto");
        }
    }

    public MensagemResponse editarMensagem(Integer mensagemId, String novoConteudo) {
        Usuario usuarioLogado = authHelper.getCurrentUser();

        Mensagem mensagem = mensagemRepository.findById(mensagemId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Mensagem nao encontrada"));

        if (!mensagem.getRemetente().getId().equals(usuarioLogado.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Voce nao pode editar a mensagem de outro usuario");
        }

        if (novoConteudo == null || novoConteudo.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Conteudo nao pode ser vazio");
        }

        mensagem.setConteudo(novoConteudo);
        mensagem.setEditada(true);
        mensagem.setDataEdicao(OffsetDateTime.now());

        MensagemResponse response = MensagemResponse.fromEntity(mensagemRepository.save(mensagem));
        chatRealtimeService.publicarMensagemEditada(response);
        return response;
    }

    public void excluirMensagem(Integer mensagemId) {
        Usuario usuarioLogado = authHelper.getCurrentUser();

        Mensagem mensagem = mensagemRepository.findById(mensagemId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Mensagem nao encontrada"));

        if (!mensagem.getRemetente().getId().equals(usuarioLogado.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Voce nao pode excluir a mensagem de outro usuario");
        }

        Integer conversaId = mensagem.getConversa() != null ? mensagem.getConversa().getId() : null;
        mensagemRepository.delete(mensagem);
        chatRealtimeService.publicarMensagemExcluida(conversaId, mensagemId);
    }
}
