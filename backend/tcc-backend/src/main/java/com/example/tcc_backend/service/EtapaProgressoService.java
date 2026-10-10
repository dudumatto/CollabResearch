package com.example.tcc_backend.service;

import com.example.tcc_backend.dto.request.AdvanceProgressStepRequest;
import com.example.tcc_backend.dto.request.CreateProjectProgressUpdateRequest;
import com.example.tcc_backend.dto.request.EtapaRequest;
import com.example.tcc_backend.dto.request.OrdemRequest;
import com.example.tcc_backend.dto.response.AdvanceProgressStepResponse;
import com.example.tcc_backend.dto.response.EtapaResponse;
import com.example.tcc_backend.dto.response.EtapaCalendarioResponse;
import com.example.tcc_backend.dto.response.ProjectProgressResponse;
import com.example.tcc_backend.dto.response.ProjectProgressUpdateResponse;
import com.example.tcc_backend.dto.response.ProgressStepResponse;
import com.example.tcc_backend.model.*;
import com.example.tcc_backend.repository.EtapaProgressoRepository;
import com.example.tcc_backend.repository.InscricaoRepository;
import com.example.tcc_backend.repository.ProgressoRepository;
import com.example.tcc_backend.repository.ProjetoRepository;
import com.example.tcc_backend.security.AuthHelper;
import com.example.tcc_backend.security.ProjectAccessPolicy;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EtapaProgressoService {

    private static final List<DefaultStep> DEFAULT_STEPS = List.of(
            new DefaultStep("Proposta aprovada", EtapaResponsavel.ORIENTADOR),
            new DefaultStep("Revisao bibliografica", EtapaResponsavel.ALUNO),
            new DefaultStep("Metodologia definida", EtapaResponsavel.ALUNO),
            new DefaultStep("Desenvolvimento", EtapaResponsavel.ALUNO),
            new DefaultStep("Revisao do orientador", EtapaResponsavel.ORIENTADOR),
            new DefaultStep("Entrega final", EtapaResponsavel.AMBOS)
    );

    private final EtapaProgressoRepository etapaProgressoRepository;
    private final ProgressoRepository progressoRepository;
    private final ProjetoRepository projetoRepository;
    private final InscricaoRepository inscricaoRepository;
    private final EtapaResponseAssembler assembler;
    private final EtapaChecklistService checklistService;
    private final AuthHelper authHelper;
    private final ProjectAccessPolicy projectAccessPolicy;

    @Transactional
    public ProjectProgressResponse obterResumo(Integer projetoId) {
        Usuario usuarioLogado = authHelper.getCurrentUser();
        Projeto projeto = carregarProjeto(projetoId);
        validarParticipacaoProjeto(projeto, usuarioLogado.getId());

        List<EtapaProgresso> etapas = etapaProgressoRepository.findByProjetoIdOrderByOrdemAsc(projetoId);
        Map<Integer, List<EtapaTarefa>> tarefas = assembler.tarefasPorEtapa(etapas);
        MarcoProgressoCalculator.Projeto calculo = MarcoProgressoCalculator.projeto(etapas, tarefas, OffsetDateTime.now());

        List<ProgressStepResponse> steps = etapas.stream()
                .map(e -> ProgressStepResponse.fromEntity(e, tarefas.get(e.getId())))
                .toList();
        List<ProjectProgressUpdateResponse> updates = progressoRepository.findByProjetoIdOrderByDataRegistroDesc(projetoId)
                .stream()
                .map(ProjectProgressUpdateResponse::fromEntity)
                .toList();

        return ProjectProgressResponse.builder()
                .projectId(projetoId)
                .overallPercent(calculo.percentualGeral())
                .percentualGeral(calculo.percentualGeral())
                .itensConcluidos(calculo.itensConcluidos())
                .itensTotal(calculo.itensTotal())
                .marcosTotal(calculo.marcosTotal())
                .marcosConcluidos(calculo.marcosConcluidos())
                .marcosEmRevisao(calculo.marcosEmRevisao())
                .marcosComAtencao(calculo.marcosComAtencao())
                .atualizacoesTotal(updates.size())
                .steps(steps)
                .marcos(assembler.montar(etapas, tarefas))
                .updates(updates)
                .build();
    }

    /**
     * Conclusao legada (PATCH .../steps/{id} e PATCH .../etapas/{id}): equivale a aprovar o marco,
     * portanto so o orientador responsavel; alunos devem enviar o marco para revisao.
     */
    @Transactional
    public AdvanceProgressStepResponse avancarEtapa(Integer projetoId, Integer etapaId, AdvanceProgressStepRequest request) {
        EtapaProgresso etapa = aprovarDiretamente(projetoId, etapaId, request);
        List<EtapaProgresso> etapas = etapaProgressoRepository.findByProjetoIdOrderByOrdemAsc(projetoId);
        Map<Integer, List<EtapaTarefa>> tarefas = assembler.tarefasPorEtapa(etapas);

        return AdvanceProgressStepResponse.builder()
                .step(ProgressStepResponse.fromEntity(etapa, tarefas.get(etapa.getId())))
                .overallPercent(MarcoProgressoCalculator.projeto(etapas, tarefas, OffsetDateTime.now()).percentualGeral())
                .build();
    }

    @Transactional
    public EtapaResponse concluirEtapa(Integer projetoId, Integer etapaId, AdvanceProgressStepRequest request) {
        return assembler.montar(aprovarDiretamente(projetoId, etapaId, request));
    }

    private EtapaProgresso aprovarDiretamente(Integer projetoId, Integer etapaId, AdvanceProgressStepRequest request) {
        Usuario usuarioLogado = authHelper.getCurrentUser();
        Projeto projeto = carregarProjeto(projetoId);
        validarParticipacaoProjeto(projeto, usuarioLogado.getId());
        validarProjetoEditavel(projeto);

        if (request == null || request.getStatus() == null || !"done".equalsIgnoreCase(request.getStatus().trim())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Status invalido");
        }

        EtapaProgresso etapa = etapaProgressoRepository.findByProjetoIdAndId(projetoId, etapaId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Etapa nao encontrada"));

        projectAccessPolicy.requireResponsibleAdvisor(projeto, usuarioLogado);

        if (etapa.getStatus() != EtapaProgressoStatus.DONE) {
            checklistService.aprovar(etapa, usuarioLogado, null);
        }
        return etapa;
    }

    @Transactional
    public List<EtapaResponse> listarEtapas(Integer projetoId) {
        Usuario usuarioLogado = authHelper.getCurrentUser();
        Projeto projeto = carregarProjeto(projetoId);
        projectAccessPolicy.requireCanViewTeam(projeto, usuarioLogado);
        return assembler.montar(etapaProgressoRepository.findByProjetoIdOrderByOrdemAsc(projetoId));
    }

    @Transactional
    public List<EtapaCalendarioResponse> listarPrazosEtapasDoUsuario() {
        Usuario usuario = authHelper.getCurrentUser();
        List<Projeto> projetos = switch (usuario.getTipo()) {
            case ALUNO -> projetoRepository.findCalendarioByAlunoUsuarioId(usuario.getId());
            case ORIENTADOR -> projetoRepository.findCalendarioByOrientadorUsuarioId(usuario.getId());
            case ADMIN -> List.of();
        };
        if (projetos.isEmpty()) {
            return List.of();
        }

        Map<Integer, List<EtapaProgresso>> etapasPorProjeto = new LinkedHashMap<>();
        projetos.forEach(projeto -> etapasPorProjeto.put(projeto.getId(), new ArrayList<>()));
        List<Integer> projetoIds = new ArrayList<>(etapasPorProjeto.keySet());
        for (EtapaProgresso etapa : etapaProgressoRepository.findAllForCalendarioByProjetoIds(projetoIds)) {
            etapasPorProjeto.get(etapa.getProjeto().getId()).add(etapa);
        }

        return projetos.stream()
                .flatMap(projeto -> etapasPorProjeto.get(projeto.getId()).stream())
                .map(EtapaCalendarioResponse::fromEntity)
                .toList();
    }

    @Transactional
    public EtapaResponse criarEtapa(Integer projetoId, EtapaRequest request) {
        Usuario usuarioLogado = authHelper.getCurrentUser();
        Projeto projeto = carregarProjeto(projetoId);
        projectAccessPolicy.requireResponsibleAdvisor(projeto, usuarioLogado);
        validarProjetoEditavel(projeto);
        validarDadosEtapa(request);

        List<EtapaProgresso> etapasExistentes = etapaProgressoRepository.findByProjetoIdOrderByOrdemAsc(projetoId);
        int proximaOrdem = etapasExistentes.stream()
                .mapToInt(e -> e.getOrdem() == null ? 0 : e.getOrdem())
                .max()
                .orElse(0) + 1;

        EtapaProgresso etapa = EtapaProgresso.builder()
                .projeto(projeto)
                .titulo(request.getTitulo().trim())
                .descricao(normalizarTexto(request.getDescricao()))
                .peso(request.getPeso() != null ? request.getPeso() : 0)
                .ordem(proximaOrdem)
                .status(EtapaProgressoStatus.PENDING)
                .responsavel(request.getResponsavel() != null ? request.getResponsavel() : EtapaResponsavel.AMBOS)
                .prazo(request.getPrazo())
                .obrigatoria(request.getObrigatoria() != null ? request.getObrigatoria() : true)
                .build();

        return assembler.montar(etapaProgressoRepository.save(etapa));
    }

    @Transactional
    public EtapaResponse atualizarEtapa(Integer projetoId, Integer etapaId, EtapaRequest request) {
        Usuario usuarioLogado = authHelper.getCurrentUser();
        Projeto projeto = carregarProjeto(projetoId);
        projectAccessPolicy.requireResponsibleAdvisor(projeto, usuarioLogado);
        validarProjetoEditavel(projeto);
        validarDadosEtapa(request);

        EtapaProgresso etapa = etapaProgressoRepository.findByProjetoIdAndId(projetoId, etapaId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Etapa nao encontrada"));

        if (etapa.getStatus() == EtapaProgressoStatus.DONE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Etapa concluida nao pode ser alterada");
        }

        etapa.setTitulo(request.getTitulo().trim());
        etapa.setDescricao(normalizarTexto(request.getDescricao()));
        etapa.setPeso(request.getPeso() != null ? request.getPeso() : etapa.getPeso());
        etapa.setResponsavel(request.getResponsavel() != null ? request.getResponsavel() : etapa.getResponsavel());
        etapa.setPrazo(request.getPrazo());
        etapa.setObrigatoria(request.getObrigatoria() != null ? request.getObrigatoria() : etapa.getObrigatoria());

        return assembler.montar(etapaProgressoRepository.save(etapa));
    }

    @Transactional
    public void excluirEtapa(Integer projetoId, Integer etapaId) {
        Usuario usuarioLogado = authHelper.getCurrentUser();
        Projeto projeto = carregarProjeto(projetoId);
        projectAccessPolicy.requireResponsibleAdvisor(projeto, usuarioLogado);
        validarProjetoEditavel(projeto);

        EtapaProgresso etapa = etapaProgressoRepository.findByProjetoIdAndId(projetoId, etapaId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Etapa nao encontrada"));

        if (etapa.getStatus() == EtapaProgressoStatus.DONE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Etapa concluida nao pode ser removida");
        }

        // tarefas e historico de revisoes saem por ON DELETE CASCADE
        etapaProgressoRepository.delete(etapa);
        etapaProgressoRepository.flush();
        renumerar(etapaProgressoRepository.findByProjetoIdOrderByOrdemAsc(projetoId));
    }

    /** Reordena os marcos; {@code ids} deve conter exatamente todos os marcos do projeto, sem repeticao. */
    @Transactional
    public List<EtapaResponse> reordenarEtapas(Integer projetoId, OrdemRequest request) {
        Usuario usuarioLogado = authHelper.getCurrentUser();
        Projeto projeto = carregarProjeto(projetoId);
        projectAccessPolicy.requireResponsibleAdvisor(projeto, usuarioLogado);
        validarProjetoEditavel(projeto);

        List<EtapaProgresso> etapas = etapaProgressoRepository.findByProjetoIdOrderByOrdemAsc(projetoId);
        List<Integer> ids = request == null ? null : request.getIds();
        Set<Integer> esperados = etapas.stream().map(EtapaProgresso::getId).collect(Collectors.toSet());
        if (ids == null || ids.size() != esperados.size() || !esperados.equals(new HashSet<>(ids))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "A lista de ids deve conter exatamente todos os marcos do projeto, sem repeticao");
        }
        Map<Integer, EtapaProgresso> porId = etapas.stream().collect(Collectors.toMap(EtapaProgresso::getId, e -> e));
        List<EtapaProgresso> novaOrdem = ids.stream().map(porId::get).toList();
        renumerar(novaOrdem);
        return assembler.montar(novaOrdem);
    }

    private void renumerar(List<EtapaProgresso> etapasNaOrdem) {
        int ordem = 1;
        for (EtapaProgresso etapa : etapasNaOrdem) {
            if (!Integer.valueOf(ordem).equals(etapa.getOrdem())) {
                etapa.setOrdem(ordem);
                etapaProgressoRepository.save(etapa);
            }
            ordem++;
        }
    }

    /** Atualizacoes narrativas sao independentes do checklist: nao concluem nem reabrem tarefas. */
    @Transactional
    public ProjectProgressUpdateResponse criarAtualizacao(Integer projetoId, CreateProjectProgressUpdateRequest request) {
        Usuario usuarioLogado = authHelper.getCurrentUser();
        Projeto projeto = carregarProjeto(projetoId);
        validarParticipacaoProjeto(projeto, usuarioLogado.getId());
        validarProjetoEditavel(projeto);

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

        LocalDateTime dataRegistro = Boolean.TRUE.equals(request.getSemData())
                ? null
                : Optional.ofNullable(request.getDataRegistro()).orElse(LocalDateTime.now());

        Progresso progresso = Progresso.builder()
                .projeto(projeto)
                .autor(usuarioLogado)
                .titulo(normalizarTexto(request.getTitulo()))
                .descricao(normalizarTexto(request.getDescricao()))
                .categoria(normalizarCategoria(request.getCategoria()))
                .etapa(etapa)
                .stepContribution(contribuicao)
                .dataRegistro(dataRegistro)
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

        etapaProgressoRepository.saveAll(criarEtapasPadrao(projeto));
    }

    private List<EtapaProgresso> criarEtapasPadrao(Projeto projeto) {
        List<EtapaProgresso> etapas = new ArrayList<>();
        for (int index = 0; index < DEFAULT_STEPS.size(); index++) {
            DefaultStep def = DEFAULT_STEPS.get(index);
            etapas.add(EtapaProgresso.builder()
                    .projeto(projeto)
                    .titulo(def.title())
                    .peso(0)
                    .ordem(index + 1)
                    .status(EtapaProgressoStatus.PENDING)
                    .responsavel(def.responsavel())
                    .build());
        }

        return etapas;
    }

    private Projeto carregarProjeto(Integer projetoId) {
        return projetoRepository.findById(projetoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Projeto nao encontrado"));
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

    private void validarProjetoEditavel(Projeto projeto) {
        if (projeto.getStatus() == StatusProjeto.FINALIZADO) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Projeto finalizado nao permite alteracoes de progresso");
        }
    }

    private void validarDadosEtapa(EtapaRequest request) {
        if (request.getPeso() != null && (request.getPeso() < 0 || request.getPeso() > 100)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Peso deve estar entre 0 e 100");
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

    private record DefaultStep(String title, EtapaResponsavel responsavel) {
    }
}
