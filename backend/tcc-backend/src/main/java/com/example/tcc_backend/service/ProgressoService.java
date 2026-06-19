package com.example.tcc_backend.service;

import com.example.tcc_backend.dto.request.ProgressoRequest;
import com.example.tcc_backend.model.*;
import com.example.tcc_backend.repository.InscricaoRepository;
import com.example.tcc_backend.repository.ProgressoRepository;
import com.example.tcc_backend.repository.ProjetoRepository;
import com.example.tcc_backend.security.AuthHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProgressoService {

    private final ProgressoRepository progressoRepository;
    private final ProjetoRepository projetoRepository;
    private final InscricaoRepository inscricaoRepository;
    private final AuthHelper authHelper;
    private final NotificacaoService notificacaoService;

    public Progresso criar(Integer projetoId, ProgressoRequest dto) {
        Usuario usuarioLogado = authHelper.getCurrentUser();
        Projeto projeto = projetoRepository.findById(projetoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Projeto nao encontrado"));
        validarParticipacaoProjeto(projeto, usuarioLogado.getId());

        Progresso progresso = Progresso.builder()
                .projeto(projeto)
                .autor(usuarioLogado)
                .titulo(normalizarTexto(dto.getTitulo()))
                .tipo(dto.getTipo())
                .fase(normalizarTexto(dto.getFase()))
                .descricao(dto.getDescricao().trim())
                .metadataJson(normalizarTexto(dto.getMetadataJson()))
                .build();
        Progresso salvo = progressoRepository.save(progresso);

        if (projeto.getOrientador() != null) {
            Integer orientadorUsuarioId = projeto.getOrientador().getUsuario().getId();
            if (!orientadorUsuarioId.equals(usuarioLogado.getId())) {
                notificacaoService.criarNotificacao(orientadorUsuarioId, "Novo progresso registrado no projeto", TipoNotificacao.PROGRESSO_REGISTRADO);
            }
        }

        return salvo;
    }

    public List<Progresso> listarPorProjeto(Integer projetoId) {
        Usuario usuarioLogado = authHelper.getCurrentUser();
        Projeto projeto = projetoRepository.findById(projetoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Projeto nao encontrado"));
        validarParticipacaoProjeto(projeto, usuarioLogado.getId());
        return progressoRepository.findByProjetoIdOrderByDataRegistroDesc(projetoId);
    }

    public Progresso atualizar(Integer id, ProgressoRequest dto) {
        Usuario usuarioLogado = authHelper.getCurrentUser();
        Progresso progresso = progressoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Progresso nao encontrado"));
        validarPermissaoEdicao(progresso, usuarioLogado.getId());

        progresso.setDescricao(dto.getDescricao().trim());
        progresso.setTitulo(normalizarTexto(dto.getTitulo()));
        if (dto.getTipo() != null) {
            progresso.setTipo(dto.getTipo());
        }
        progresso.setFase(normalizarTexto(dto.getFase()));
        progresso.setMetadataJson(normalizarTexto(dto.getMetadataJson()));
        return progressoRepository.save(progresso);
    }

    public void remover(Integer id) {
        Usuario usuarioLogado = authHelper.getCurrentUser();
        Progresso progresso = progressoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Progresso nao encontrado"));
        validarPermissaoEdicao(progresso, usuarioLogado.getId());
        progressoRepository.delete(progresso);
    }

    private void validarParticipacaoProjeto(Projeto projeto, Integer usuarioId) {
        boolean donoProjeto = (projeto.getOrientador() != null && projeto.getOrientador().getUsuario().getId().equals(usuarioId))
                || (projeto.getAlunoCriador() != null && projeto.getAlunoCriador().getUsuario().getId().equals(usuarioId));

        if (donoProjeto) {
            return;
        }

        Inscricao inscricao = inscricaoRepository.findByProjetoIdAndAlunoUsuarioId(projeto.getId(), usuarioId).orElse(null);
        if (inscricao == null || inscricao.getStatus() != StatusInscricao.APROVADO) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Usuario nao participa deste projeto");
        }
    }

    private void validarPermissaoEdicao(Progresso progresso, Integer usuarioId) {
        Projeto projeto = progresso.getProjeto();

        boolean autorDoRegistro = progresso.getAutor() != null && progresso.getAutor().getId().equals(usuarioId);
        boolean donoProjeto = (projeto.getOrientador() != null && projeto.getOrientador().getUsuario().getId().equals(usuarioId))
                || (projeto.getAlunoCriador() != null && projeto.getAlunoCriador().getUsuario().getId().equals(usuarioId));

        if (!autorDoRegistro && !donoProjeto) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Sem permissao para editar este progresso");
        }
    }

    private String normalizarTexto(String valor) {
        if (valor == null) {
            return null;
        }
        String normalizado = valor.trim();
        return normalizado.isEmpty() ? null : normalizado;
    }
}
