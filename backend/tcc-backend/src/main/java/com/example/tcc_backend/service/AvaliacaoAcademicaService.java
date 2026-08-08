package com.example.tcc_backend.service;

import com.example.tcc_backend.dto.request.AvaliacaoAcademicaRequest;
import com.example.tcc_backend.dto.request.AvaliacaoCienciaRequest;
import com.example.tcc_backend.dto.response.AvaliacaoAcademicaResponse;
import com.example.tcc_backend.model.*;
import com.example.tcc_backend.repository.*;
import com.example.tcc_backend.security.AuthHelper;
import com.example.tcc_backend.security.ProjectAccessPolicy;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AvaliacaoAcademicaService {

    private static final int COMENTARIO_MAX = 2000;

    private final AuthHelper authHelper;
    private final ProjetoRepository projetoRepository;
    private final EtapaProgressoRepository etapaProgressoRepository;
    private final AlunoRepository alunoRepository;
    private final AcademicEvaluationRepository academicEvaluationRepository;
    private final AcademicEvaluationAcknowledgementRepository acknowledgementRepository;
    private final ProjectAccessPolicy projectAccessPolicy;

    @Transactional
    public AvaliacaoAcademicaResponse criar(Integer projetoId, AvaliacaoAcademicaRequest request) {
        Usuario usuarioLogado = authHelper.getCurrentUser();
        Projeto projeto = carregarProjeto(projetoId);
        projectAccessPolicy.requireResponsibleAdvisor(projeto, usuarioLogado);

        validarRequest(request);

        EtapaProgresso etapa = carregarEtapaConcluida(projetoId, request.getEtapaId());
        Aluno aluno = carregarAluno(request.getAlunoId());

        validarVinculoAluno(projeto, aluno);
        verificarDuplicidade(projetoId, request.getEtapaId(), request.getAlunoId());

        BigDecimal media = calcularMedia(request);

        AcademicEvaluation avaliacao = AcademicEvaluation.builder()
                .projeto(projeto)
                .etapa(etapa)
                .aluno(aluno)
                .orientador(projeto.getOrientador())
                .participacao(request.getParticipacao())
                .qualidadeTecnica(request.getQualidadeTecnica())
                .cumprimentoDePrazos(request.getCumprimentoDePrazos())
                .comunicacao(request.getComunicacao())
                .comentarioOrientador(request.getComentarioOrientador().trim())
                .media(media)
                .build();

        avaliacao = academicEvaluationRepository.save(avaliacao);
        return AvaliacaoAcademicaResponse.fromEntity(avaliacao, null);
    }

    @Transactional
    public AvaliacaoAcademicaResponse atualizar(Integer projetoId, Long avaliacaoId, AvaliacaoAcademicaRequest request) {
        Usuario usuarioLogado = authHelper.getCurrentUser();
        Projeto projeto = carregarProjeto(projetoId);
        projectAccessPolicy.requireResponsibleAdvisor(projeto, usuarioLogado);

        validarRequest(request);

        AcademicEvaluation avaliacao = carregarAvaliacao(projetoId, avaliacaoId);

        if (acknowledgementRepository.existsByAvaliacaoId(avaliacao.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Avaliacao ja registrada pelo aluno; nao pode ser alterada");
        }

        avaliacao.setParticipacao(request.getParticipacao());
        avaliacao.setQualidadeTecnica(request.getQualidadeTecnica());
        avaliacao.setCumprimentoDePrazos(request.getCumprimentoDePrazos());
        avaliacao.setComunicacao(request.getComunicacao());
        avaliacao.setComentarioOrientador(request.getComentarioOrientador().trim());
        avaliacao.setMedia(calcularMedia(request));

        avaliacao = academicEvaluationRepository.save(avaliacao);
        return AvaliacaoAcademicaResponse.fromEntity(avaliacao, null);
    }

    @Transactional(readOnly = true)
    public List<AvaliacaoAcademicaResponse> listar(Integer projetoId) {
        Usuario usuarioLogado = authHelper.getCurrentUser();
        Projeto projeto = carregarProjeto(projetoId);

        ProjectAccessPolicy.Relationship relacao = projectAccessPolicy.relationship(projeto, usuarioLogado);
        if (relacao == ProjectAccessPolicy.Relationship.EXTERNAL) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Sem permissao para visualizar as avaliacoes deste projeto");
        }

        Integer alunoId = null;
        if (relacao == ProjectAccessPolicy.Relationship.STUDENT_CREATOR
                || relacao == ProjectAccessPolicy.Relationship.APPROVED_MEMBER) {
            Aluno aluno = alunoRepository.findByUsuarioId(usuarioLogado.getId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN,
                            "Sem permissao para visualizar as avaliacoes deste projeto"));
            alunoId = aluno.getId();
        }

        List<AcademicEvaluation> avaliacoes = alunoId != null
                ? academicEvaluationRepository.findByProjetoIdAndAlunoId(projetoId, alunoId)
                : academicEvaluationRepository.findByProjetoId(projetoId);

        return avaliacoes.stream()
                .map(a -> AvaliacaoAcademicaResponse.fromEntity(a, buscarCiencia(a)))
                .toList();
    }

    @Transactional(readOnly = true)
    public AvaliacaoAcademicaResponse obter(Integer projetoId, Long avaliacaoId) {
        Usuario usuarioLogado = authHelper.getCurrentUser();
        Projeto projeto = carregarProjeto(projetoId);
        AcademicEvaluation avaliacao = carregarAvaliacao(projetoId, avaliacaoId);

        Integer alunoUsuarioId = avaliacao.getAluno() != null && avaliacao.getAluno().getUsuario() != null
                ? avaliacao.getAluno().getUsuario().getId()
                : null;
        projectAccessPolicy.requireCanViewEvaluation(projeto, usuarioLogado, alunoUsuarioId);

        return AvaliacaoAcademicaResponse.fromEntity(avaliacao, buscarCiencia(avaliacao));
    }

    @Transactional
    public AvaliacaoAcademicaResponse registrarCiencia(Integer projetoId, Long avaliacaoId, AvaliacaoCienciaRequest request) {
        Usuario usuarioLogado = authHelper.getCurrentUser();
        Projeto projeto = carregarProjeto(projetoId);
        AcademicEvaluation avaliacao = carregarAvaliacao(projetoId, avaliacaoId);

        Integer alunoUsuarioId = avaliacao.getAluno() != null && avaliacao.getAluno().getUsuario() != null
                ? avaliacao.getAluno().getUsuario().getId()
                : null;
        projectAccessPolicy.requireCanRegisterAcknowledge(projeto, usuarioLogado, alunoUsuarioId);

        if (acknowledgementRepository.existsByAvaliacaoId(avaliacao.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Ciencia ja registrada para esta avaliacao");
        }

        String comentario = request != null ? normalizarTexto(request.getComentarioAluno()) : null;
        if (comentario != null && comentario.length() > COMENTARIO_MAX) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Comentario deve ter no maximo " + COMENTARIO_MAX + " caracteres");
        }

        AcademicEvaluationAcknowledgement ciencia = AcademicEvaluationAcknowledgement.builder()
                .avaliacao(avaliacao)
                .aluno(usuarioLogado)
                .comentarioAluno(comentario)
                .build();
        ciencia = acknowledgementRepository.save(ciencia);

        return AvaliacaoAcademicaResponse.fromEntity(avaliacao, ciencia);
    }

    private void validarRequest(AvaliacaoAcademicaRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Dados da avaliacao obrigatorios");
        }
        if (request.getAlunoId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Aluno e obrigatorio");
        }
        if (request.getEtapaId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Etapa e obrigatoria");
        }
        if (request.getParticipacao() == null || foraDoIntervalo(request.getParticipacao())
                || request.getQualidadeTecnica() == null || foraDoIntervalo(request.getQualidadeTecnica())
                || request.getCumprimentoDePrazos() == null || foraDoIntervalo(request.getCumprimentoDePrazos())
                || request.getComunicacao() == null || foraDoIntervalo(request.getComunicacao())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Criterios de avaliacao devem estar entre 1 e 5");
        }
        String comentario = normalizarTexto(request.getComentarioOrientador());
        if (comentario == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Comentario do orientador e obrigatorio");
        }
        if (comentario.length() > COMENTARIO_MAX) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Comentario deve ter no maximo " + COMENTARIO_MAX + " caracteres");
        }
    }

    private boolean foraDoIntervalo(Integer valor) {
        return valor < 1 || valor > 5;
    }

    private BigDecimal calcularMedia(AvaliacaoAcademicaRequest request) {
        double soma = request.getParticipacao()
                + request.getQualidadeTecnica()
                + request.getCumprimentoDePrazos()
                + request.getComunicacao();
        return BigDecimal.valueOf(soma / 4.0)
                .setScale(2, RoundingMode.HALF_UP);
    }

    private void verificarDuplicidade(Integer projetoId, Integer etapaId, Integer alunoId) {
        if (academicEvaluationRepository.findByProjetoIdAndEtapaIdAndAlunoId(projetoId, etapaId, alunoId).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Ja existe avaliacao para este aluno, projeto e etapa");
        }
    }

    private void validarVinculoAluno(Projeto projeto, Aluno aluno) {
        ProjectAccessPolicy.Relationship relacao = projectAccessPolicy.relationship(projeto, aluno.getUsuario());
        if (relacao != ProjectAccessPolicy.Relationship.STUDENT_CREATOR
                && relacao != ProjectAccessPolicy.Relationship.APPROVED_MEMBER) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Aluno nao e membro aprovado do projeto");
        }
    }

    private EtapaProgresso carregarEtapaConcluida(Integer projetoId, Integer etapaId) {
        EtapaProgresso etapa = etapaProgressoRepository.findByProjetoIdAndId(projetoId, etapaId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Etapa nao encontrada"));
        if (etapa.getStatus() != EtapaProgressoStatus.DONE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "A avaliacao so pode ser registrada para etapa concluida");
        }
        return etapa;
    }

    private Aluno carregarAluno(Integer alunoId) {
        return alunoRepository.findById(alunoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Aluno nao encontrado"));
    }

    private AcademicEvaluation carregarAvaliacao(Integer projetoId, Long avaliacaoId) {
        return academicEvaluationRepository.findByIdAndProjetoId(avaliacaoId, projetoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Avaliacao nao encontrada"));
    }

    private AcademicEvaluationAcknowledgement buscarCiencia(AcademicEvaluation avaliacao) {
        return acknowledgementRepository.findByAvaliacaoId(avaliacao.getId()).orElse(null);
    }

    private Projeto carregarProjeto(Integer projetoId) {
        return projetoRepository.findById(projetoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Projeto nao encontrado"));
    }

    private String normalizarTexto(String valor) {
        if (valor == null) {
            return null;
        }
        String normalizado = valor.trim();
        return normalizado.isEmpty() ? null : normalizado;
    }
}
