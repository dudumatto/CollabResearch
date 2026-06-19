package com.example.tcc_backend.service;

import com.example.tcc_backend.dto.request.FeedbackRequest;
import com.example.tcc_backend.model.Feedback;
import com.example.tcc_backend.model.Projeto;
import com.example.tcc_backend.model.StatusInscricao;
import com.example.tcc_backend.model.TipoUsuario;
import com.example.tcc_backend.model.Usuario;
import com.example.tcc_backend.repository.FeedbackRepository;
import com.example.tcc_backend.repository.InscricaoRepository;
import com.example.tcc_backend.repository.ProjetoRepository;
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
public class FeedbackService {

    private final FeedbackRepository feedbackRepository;
    private final ProjetoRepository projetoRepository;
    private final InscricaoRepository inscricaoRepository;
    private final AuthHelper authHelper;

    public Feedback criar(FeedbackRequest dto) {
        Usuario usuarioLogado = authHelper.getCurrentUser();
        Projeto projeto = projetoRepository.findById(dto.getProjetoId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Projeto nao encontrado"));

        validarPermissaoParaAvaliar(projeto, usuarioLogado);

        if (feedbackRepository.existsByProjetoIdAndAvaliadorId(projeto.getId(), usuarioLogado.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Voce ja registrou feedback para este projeto");
        }

        String comentario = normalizarComentario(dto.getComentario());

        Feedback feedback = Feedback.builder()
                .projeto(projeto)
                .avaliador(usuarioLogado)
                .nota(dto.getNota())
                .comentario(comentario)
                .build();
        return feedbackRepository.save(feedback);
    }

    public List<Feedback> listarPorProjeto(Integer projetoId) {
        return feedbackRepository.findByProjetoId(projetoId);
    }

    public Page<Feedback> listarPorProjeto(Integer projetoId, Pageable pageable) {
        return feedbackRepository.findByProjetoId(projetoId, pageable);
    }

    public List<Feedback> listarPorUsuario(Integer usuarioId) {
        return feedbackRepository.findByProjetoOrientadorUsuarioIdOrProjetoAlunoCriadorUsuarioId(usuarioId, usuarioId);
    }

    public Page<Feedback> listarPorUsuario(Integer usuarioId, Pageable pageable) {
        return feedbackRepository.findByProjetoOrientadorUsuarioIdOrProjetoAlunoCriadorUsuarioId(usuarioId, usuarioId, pageable);
    }

    private void validarPermissaoParaAvaliar(Projeto projeto, Usuario usuarioLogado) {
        if (usuarioLogado.getTipo() != TipoUsuario.ALUNO) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Somente alunos podem registrar feedback");
        }

        boolean ehAlunoCriador = projeto.getAlunoCriador() != null
                && projeto.getAlunoCriador().getUsuario().getId().equals(usuarioLogado.getId());
        if (ehAlunoCriador) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Nao e permitido avaliar o proprio projeto");
        }

        boolean temParticipacaoAprovada = inscricaoRepository.findByProjetoIdAndAlunoUsuarioId(projeto.getId(), usuarioLogado.getId())
                .filter(inscricao -> inscricao.getStatus() == StatusInscricao.APROVADO)
                .isPresent();

        if (!temParticipacaoAprovada) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Somente alunos aprovados no projeto podem registrar feedback");
        }
    }

    private String normalizarComentario(String comentario) {
        if (comentario == null) {
            return null;
        }

        String comentarioNormalizado = comentario.trim();
        return comentarioNormalizado.isEmpty() ? null : comentarioNormalizado;
    }
}
