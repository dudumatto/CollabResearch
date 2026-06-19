package com.example.tcc_backend.service;

import com.example.tcc_backend.dto.request.InscricaoAvaliacaoRequest;
import com.example.tcc_backend.dto.request.InscricaoRequest;
import com.example.tcc_backend.model.Aluno;
import com.example.tcc_backend.model.Inscricao;
import com.example.tcc_backend.model.Projeto;
import com.example.tcc_backend.model.StatusInscricao;
import com.example.tcc_backend.model.StatusProjeto;
import com.example.tcc_backend.model.TipoNotificacao;
import com.example.tcc_backend.model.TipoUsuario;
import com.example.tcc_backend.model.Usuario;
import com.example.tcc_backend.repository.AlunoRepository;
import com.example.tcc_backend.repository.InscricaoRepository;
import com.example.tcc_backend.repository.ProjetoRepository;
import com.example.tcc_backend.security.AuthHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class InscricaoService {

    private final InscricaoRepository inscricaoRepository;
    private final AlunoRepository alunoRepository;
    private final ProjetoRepository projetoRepository;
    private final AuthHelper authHelper;
    private final NotificacaoService notificacaoService;

    public List<Inscricao> findAll() {
        return inscricaoRepository.findAll();
    }

    public Page<Inscricao> findAll(Pageable pageable) {
        return inscricaoRepository.findAll(pageable);
    }

    public Inscricao findById(Integer id) {
        return inscricaoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Inscricao nao encontrada"));
    }

    public List<Inscricao> findByProjeto(Integer projetoId) {
        return inscricaoRepository.findByProjetoId(projetoId);
    }

    /**
     * Inscrições do usuário autenticado na visão de "minhas inscrições".
     * Alunos veem as próprias inscrições; demais perfis recebem lista vazia.
     */
    public List<Inscricao> findByUsuarioLogado() {
        Usuario usuarioLogado = authHelper.getCurrentUser();
        if (usuarioLogado.getTipo() == TipoUsuario.ALUNO) {
            return inscricaoRepository.findByAlunoUsuarioId(usuarioLogado.getId());
        }
        return List.of();
    }

    public Page<Inscricao> findByProjeto(Integer projetoId, Pageable pageable) {
        return inscricaoRepository.findByProjetoId(projetoId, pageable);
    }

    public Inscricao create(InscricaoRequest dto) {
        Usuario usuarioLogado = authHelper.getCurrentUser();

        if (usuarioLogado.getTipo() != TipoUsuario.ALUNO) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Apenas alunos podem se inscrever em projetos");
        }

        Aluno aluno = alunoRepository.findByUsuarioId(usuarioLogado.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Aluno nao encontrado"));

        Projeto projeto = projetoRepository.findById(dto.getProjetoId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Projeto nao encontrado"));

        if (inscricaoRepository.existsByAlunoIdAndProjetoId(aluno.getId(), projeto.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Voce ja esta inscrito neste projeto");
        }

        if (projeto.getStatus() != StatusProjeto.ABERTO) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Este projeto nao esta aceitando inscricoes");
        }

        Inscricao inscricao = Inscricao.builder()
                .aluno(aluno)
                .projeto(projeto)
                .motivacao(normalizarTexto(dto.getMotivacao()))
                .build();

        try {
            Inscricao salva = inscricaoRepository.save(inscricao);
            if (projeto.getOrientador() != null) {
                notificacaoService.criarNotificacao(
                        projeto.getOrientador().getUsuario().getId(),
                        "Nova inscricao recebida no projeto " + projeto.getTitulo(),
                        TipoNotificacao.INSCRICAO_RECEBIDA,
                        "INSCRICAO",
                        salva.getId(),
                        "/app/projects/" + projeto.getId() + "/applications",
                        projeto.getTitulo()
                );
            }
            return salva;
        } catch (DataIntegrityViolationException ex) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Voce ja esta inscrito neste projeto");
        }
    }

    public Inscricao aprovar(Integer id) {
        return aprovar(id, null);
    }

    public Inscricao aprovar(Integer id, InscricaoAvaliacaoRequest dto) {
        Inscricao inscricao = findById(id);
        validarOrientador(inscricao);

        inscricao.setStatus(StatusInscricao.APROVADO);
        inscricao.setParecerOrientador(dto != null ? normalizarTexto(dto.getParecerOrientador()) : inscricao.getParecerOrientador());

        Inscricao salva = inscricaoRepository.save(inscricao);
        notificacaoService.criarNotificacao(
                inscricao.getAluno().getUsuario().getId(),
                "Sua inscricao foi aprovada",
                TipoNotificacao.INSCRICAO_APROVADA,
                "INSCRICAO",
                inscricao.getId(),
                "/app/applications",
                inscricao.getProjeto().getTitulo()
        );
        return salva;
    }

    public Inscricao rejeitar(Integer id) {
        return rejeitar(id, null);
    }

    public Inscricao rejeitar(Integer id, InscricaoAvaliacaoRequest dto) {
        Inscricao inscricao = findById(id);
        validarOrientador(inscricao);

        inscricao.setStatus(StatusInscricao.REJEITADO);
        inscricao.setParecerOrientador(dto != null ? normalizarTexto(dto.getParecerOrientador()) : inscricao.getParecerOrientador());

        Inscricao salva = inscricaoRepository.save(inscricao);
        notificacaoService.criarNotificacao(
                inscricao.getAluno().getUsuario().getId(),
                "Sua inscricao foi rejeitada",
                TipoNotificacao.INSCRICAO_REJEITADA,
                "INSCRICAO",
                inscricao.getId(),
                "/app/applications",
                inscricao.getProjeto().getTitulo()
        );
        return salva;
    }

    public void cancel(Integer id) {
        Usuario usuarioLogado = authHelper.getCurrentUser();
        Inscricao inscricao = findById(id);

        if (!inscricao.getAluno().getUsuario().getId().equals(usuarioLogado.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Voce nao pode cancelar a inscricao de outro aluno");
        }

        inscricaoRepository.delete(inscricao);
    }

    public void cancelarMinha(Integer id) {
        cancel(id);
    }

    public Inscricao update(Integer id, InscricaoRequest dto) {
        Usuario usuarioLogado = authHelper.getCurrentUser();
        Inscricao inscricao = findById(id);

        if (!inscricao.getAluno().getUsuario().getId().equals(usuarioLogado.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Voce nao pode editar a inscricao de outro aluno");
        }

        Projeto projeto = projetoRepository.findById(dto.getProjetoId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Projeto nao encontrado"));

        inscricao.setProjeto(projeto);
        inscricao.setMotivacao(normalizarTexto(dto.getMotivacao()));
        return inscricaoRepository.save(inscricao);
    }

    private void validarOrientador(Inscricao inscricao) {
        Usuario usuarioLogado = authHelper.getCurrentUser();

        if (usuarioLogado.getTipo() != TipoUsuario.ORIENTADOR) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Apenas orientadores podem aprovar ou rejeitar inscricoes");
        }

        boolean isOrientadorDoProjeto = inscricao.getProjeto().getOrientador() != null &&
                inscricao.getProjeto().getOrientador().getUsuario().getId().equals(usuarioLogado.getId());

        if (!isOrientadorDoProjeto) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Voce nao e o orientador deste projeto");
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
