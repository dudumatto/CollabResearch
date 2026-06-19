package com.example.tcc_backend.service;

import com.example.tcc_backend.dto.request.AdvanceProgressStepRequest;
import com.example.tcc_backend.dto.request.CreateProjectProgressUpdateRequest;
import com.example.tcc_backend.dto.response.AdvanceProgressStepResponse;
import com.example.tcc_backend.dto.response.ProjectProgressResponse;
import com.example.tcc_backend.dto.response.ProjectProgressUpdateResponse;
import com.example.tcc_backend.dto.response.ProgressStepResponse;
import com.example.tcc_backend.model.*;
import com.example.tcc_backend.repository.EtapaProgressoRepository;
import com.example.tcc_backend.repository.InscricaoRepository;
import com.example.tcc_backend.repository.ProgressoRepository;
import com.example.tcc_backend.repository.ProjetoRepository;
import com.example.tcc_backend.security.AuthHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class EtapaProgressoService {

    private static final List<DefaultStep> DEFAULT_STEPS = List.of(
            new DefaultStep("Proposta aprovada", 10),
            new DefaultStep("Revisao bibliografica", 15),
            new DefaultStep("Metodologia definida", 15),
            new DefaultStep("Desenvolvimento", 30),
            new DefaultStep("Revisao do orientador", 20),
            new DefaultStep("Entrega final", 10)
    );

    private final EtapaProgressoRepository etapaProgressoRepository;
    private final ProgressoRepository progressoRepository;
    private final ProjetoRepository projetoRepository;
    private final InscricaoRepository inscricaoRepository;
    private final AuthHelper authHelper;

    @Transactional
    public ProjectProgressResponse obterResumo(Integer projetoId) {
        Usuario usuarioLogado = authHelper.getCurrentUser();
        Projeto projeto = carregarProjeto(projetoId);
        validarParticipacaoProjeto(projeto, usuarioLogado.getId());

        List<EtapaProgresso> etapas = carregarOuCriarEtapas(projeto);
        sincronizarEtapasAtivas(etapas);

        List<ProgressStepResponse> steps = etapas.stream()
                .map(ProgressStepResponse::fromEntity)
                .toList();
        List<ProjectProgressUpdateResponse> updates = progressoRepository.findByProjetoIdOrderByDataRegistroDesc(projetoId)
                .stream()
                .map(ProjectProgressUpdateResponse::fromEntity)
                .toList();

        return ProjectProgressResponse.builder()
                .projectId(projetoId)
                .overallPercent(calcularPercentualGeral(etapas))
                .steps(steps)
                .updates(updates)
                .build();
    }

    @Transactional
    public AdvanceProgressStepResponse avancarEtapa(Integer projetoId, Integer etapaId, AdvanceProgressStepRequest request) {
        Usuario usuarioLogado = authHelper.getCurrentUser();
        Projeto projeto = carregarProjeto(projetoId);
        validarParticipacaoProjeto(projeto, usuarioLogado.getId());

        if (request == null || request.getStatus() == null || !"done".equalsIgnoreCase(request.getStatus().trim())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Status invalido");
        }

        List<EtapaProgresso> etapas = carregarOuCriarEtapas(projeto);
        EtapaProgresso etapa = etapaProgressoRepository.findByProjetoIdAndId(projetoId, etapaId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Etapa nao encontrada"));

        validarPermissaoConclusao(etapa, usuarioLogado);

        if (etapa.getStatus() != EtapaProgressoStatus.DONE) {
            etapa.setStatus(EtapaProgressoStatus.DONE);
            etapa.setConcluidaEm(LocalDateTime.now());
            etapa.setConcluidaPor(usuarioLogado);
            etapaProgressoRepository.save(etapa);
        }

        sincronizarEtapasAtivas(etapas);

        return AdvanceProgressStepResponse.builder()
                .step(ProgressStepResponse.fromEntity(etapa))
                .overallPercent(calcularPercentualGeral(etapas))
                .build();
    }

    @Transactional
    public ProjectProgressUpdateResponse criarAtualizacao(Integer projetoId, CreateProjectProgressUpdateRequest request) {
        Usuario usuarioLogado = authHelper.getCurrentUser();
        Projeto projeto = carregarProjeto(projetoId);
        validarParticipacaoProjeto(projeto, usuarioLogado.getId());

        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Dados invalidos");
        }
        if (request.getTitulo() == null || request.getTitulo().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Titulo e obrigatorio");
        }

        EtapaProgresso etapa = null;
        if (request.getEtapaId() != null) {
            etapa = etapaProgressoRepository.findByProjetoIdAndId(projetoId, request.getEtapaId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Etapa nao encontrada"));
        }

        Integer contribuicao = Optional.ofNullable(request.getEtapaContribuicao()).orElse(0);
        if (contribuicao < 0 || contribuicao > 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Contribuicao deve estar entre 0 e 100");
        }
        if (etapa == null) {
            contribuicao = 0;
        }

        Progresso progresso = Progresso.builder()
                .projeto(projeto)
                .autor(usuarioLogado)
                .titulo(normalizarTexto(request.getTitulo()))
                .descricao(normalizarTexto(request.getDescricao()))
                .categoria(normalizarCategoria(request.getCategoria()))
                .etapa(etapa)
                .stepContribution(contribuicao)
                .tipo(mapaTipo(request.getCategoria()))
                .build();

        Progresso salvo = progressoRepository.save(progresso);
        return ProjectProgressUpdateResponse.fromEntity(salvo);
    }

    @Transactional
    public void garantirEtapasPadrao(Projeto projeto) {
        if (projeto == null || projeto.getId() == null) {
            return;
        }

        if (etapaProgressoRepository.countByProjetoId(projeto.getId()) > 0) {
            return;
        }

        List<EtapaProgresso> etapas = new ArrayList<>();
        for (int index = 0; index < DEFAULT_STEPS.size(); index++) {
            DefaultStep def = DEFAULT_STEPS.get(index);
            etapas.add(EtapaProgresso.builder()
                    .projeto(projeto)
                    .titulo(def.title())
                    .peso(def.weight())
                    .ordem(index + 1)
                    .status(index == 0 ? EtapaProgressoStatus.ACTIVE : EtapaProgressoStatus.PENDING)
                    .build());
        }

        etapaProgressoRepository.saveAll(etapas);
    }

    private Projeto carregarProjeto(Integer projetoId) {
        return projetoRepository.findById(projetoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Projeto nao encontrado"));
    }

    private List<EtapaProgresso> carregarOuCriarEtapas(Projeto projeto) {
        List<EtapaProgresso> etapas = etapaProgressoRepository.findByProjetoIdOrderByOrdemAsc(projeto.getId());
        if (!etapas.isEmpty()) {
            return etapas;
        }

        garantirEtapasPadrao(projeto);
        return etapaProgressoRepository.findByProjetoIdOrderByOrdemAsc(projeto.getId());
    }

    private void sincronizarEtapasAtivas(List<EtapaProgresso> etapas) {
        boolean precisaSalvar = false;
        boolean encontrouAtiva = false;

        for (EtapaProgresso etapa : etapas) {
            if (etapa.getStatus() == EtapaProgressoStatus.DONE || etapa.getStatus() == EtapaProgressoStatus.REJECTED) {
                continue;
            }

            if (!encontrouAtiva) {
                if (etapa.getStatus() != EtapaProgressoStatus.ACTIVE) {
                    etapa.setStatus(EtapaProgressoStatus.ACTIVE);
                    precisaSalvar = true;
                }
                encontrouAtiva = true;
            } else if (etapa.getStatus() != EtapaProgressoStatus.PENDING) {
                etapa.setStatus(EtapaProgressoStatus.PENDING);
                precisaSalvar = true;
            }
        }

        if (precisaSalvar) {
            etapaProgressoRepository.saveAll(etapas);
        }
    }

    private Integer calcularPercentualGeral(List<EtapaProgresso> etapas) {
        return etapas.stream()
                .filter(etapa -> etapa.getStatus() == EtapaProgressoStatus.DONE)
                .mapToInt(etapa -> Optional.ofNullable(etapa.getPeso()).orElse(0))
                .sum();
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

    private void validarPermissaoConclusao(EtapaProgresso etapa, Usuario usuario) {
        TipoUsuario tipo = usuario.getTipo();
        boolean podeConcluir = switch (etapa.getOrdem()) {
            case 1, 5 -> tipo == TipoUsuario.ORIENTADOR;
            case 2, 3, 4 -> tipo == TipoUsuario.ALUNO;
            case 6 -> tipo == TipoUsuario.ALUNO || tipo == TipoUsuario.ORIENTADOR;
            default -> tipo == TipoUsuario.ALUNO || tipo == TipoUsuario.ORIENTADOR;
        };

        if (!podeConcluir) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Sem permissao para concluir esta etapa");
        }
    }

    private String normalizarTexto(String valor) {
        if (valor == null) {
            return null;
        }
        String normalizado = valor.trim();
        return normalizado.isEmpty() ? null : normalizado;
    }

    private String normalizarCategoria(String categoria) {
        String valor = normalizarTexto(categoria);
        return valor == null ? null : valor.toLowerCase(Locale.ROOT);
    }

    private TipoProgresso mapaTipo(String categoria) {
        String valor = normalizarCategoria(categoria);
        if (valor == null) {
            return TipoProgresso.ATUALIZACAO;
        }

        return switch (valor) {
            case "milestone" -> TipoProgresso.MARCO;
            case "problem" -> TipoProgresso.BLOQUEIO;
            default -> TipoProgresso.ATUALIZACAO;
        };
    }

    private record DefaultStep(String title, int weight) {
    }
}
