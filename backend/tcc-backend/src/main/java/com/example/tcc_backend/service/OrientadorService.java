package com.example.tcc_backend.service;

import com.example.tcc_backend.dto.request.OrientadorPerfilRequest;
import com.example.tcc_backend.dto.request.UsuarioRequest;
import com.example.tcc_backend.dto.response.*;
import com.example.tcc_backend.model.*;
import com.example.tcc_backend.repository.*;
import com.example.tcc_backend.security.AuthHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrientadorService {

    private static final int LIMITE_FILA = 5;

    private final AuthHelper authHelper;
    private final ProjetoRepository projetoRepository;
    private final InscricaoRepository inscricaoRepository;
    private final EtapaProgressoRepository etapaProgressoRepository;
    private final ProjectDeliveryRepository projectDeliveryRepository;
    private final DeliveryVersionRepository deliveryVersionRepository;
    private final AcademicEvaluationRepository academicEvaluationRepository;
    private final AcademicEvaluationAcknowledgementRepository acknowledgementRepository;
    private final AlunoRepository alunoRepository;
    private final ProgressoRepository progressoRepository;
    private final OrientadorRepository orientadorRepository;
    private final UsuarioRepository usuarioRepository;
    private final UsuarioService usuarioService;

    @Transactional(readOnly = true)
    public OrientadorDashboardResponse dashboard() {
        Usuario usuario = authHelper.getCurrentUser();
        exigirPerfilAcademico(usuario);

        List<Projeto> projetos = projetosDoEscopo(usuario);
        List<Inscricao> inscricoes = inscricoesDoEscopo(usuario);
        List<EtapaProgresso> etapas = etapasDoEscopo(usuario);
        List<ProjectDelivery> entregas = entregasDoEscopo(usuario);
        List<AcademicEvaluation> avaliacoes = avaliacoesDoEscopo(usuario);

        List<Projeto> ativos = projetos.stream()
                .filter(p -> p.getStatus() == StatusProjeto.ABERTO
                        || p.getStatus() == StatusProjeto.EM_ANDAMENTO)
                .toList();
        List<Projeto> solicitacoes = projetos.stream()
                .filter(p -> p.getStatus() == StatusProjeto.PENDENTE_ORIENTADOR)
                .toList();
        List<Inscricao> pendentes = inscricoes.stream()
                .filter(i -> !inscricaoDoCriadorDoProjeto(i))
                .filter(i -> i.getStatus() == StatusInscricao.PENDENTE)
                .toList();
        Set<Aluno> orientandos = orientandosAtivos(inscricoes, ativos);
        List<EtapaProgresso> atrasadas = etapas.stream()
                .filter(OrientadorService::estaAtrasada)
                .toList();
        List<ProjectDelivery> aguardandoRevisao = entregas.stream()
                .filter(e -> e.getStatus() == EntregaStatus.PENDING_REVIEW)
                .toList();
        List<AcademicEvaluation> aguardandoCiencia = avaliacoes.stream()
                .filter(a -> !acknowledgementRepository.existsByAvaliacaoId(a.getId()))
                .toList();

        OrientadorDashboardMetricas metricas = OrientadorDashboardMetricas.builder()
                .projetosAtivos(ativos.size())
                .solicitacoesOrientacao(solicitacoes.size())
                .inscricoesPendentes(pendentes.size())
                .orientandosAtivos(orientandos.size())
                .etapasAtrasadas(atrasadas.size())
                .entregasAguardandoRevisao(aguardandoRevisao.size())
                .avaliacoesAguardandoCiencia(aguardandoCiencia.size())
                .build();

        OrientadorDashboardFilas filas = OrientadorDashboardFilas.builder()
                .projetosAtivos(fila(ativos, OrientadorService::projetoQueueItem))
                .solicitacoesOrientacao(fila(solicitacoes, OrientadorService::solicitacaoQueueItem))
                .inscricoesPendentes(fila(pendentes, OrientadorService::inscricaoPendenteQueueItem))
                .orientandosAtivos(fila(orientandos.stream().toList(), OrientadorService::orientandoQueueItem))
                .etapasAtrasadas(fila(atrasadas, OrientadorService::etapaAtrasadaQueueItem))
                .entregasAguardandoRevisao(fila(aguardandoRevisao, OrientadorService::entregaQueueItem))
                .avaliacoesAguardandoCiencia(fila(aguardandoCiencia, OrientadorService::avaliacaoQueueItem))
                .build();

        return OrientadorDashboardResponse.builder()
                .metricas(metricas)
                .filas(filas)
                .build();
    }

    @Transactional(readOnly = true)
    public List<EntregaResponse> entregas(String status, Integer projetoId) {
        Usuario usuario = authHelper.getCurrentUser();
        exigirPerfilAcademico(usuario);

        EntregaStatus statusEnum = null;
        if (status != null && !status.isBlank()) {
            try {
                statusEnum = EntregaStatus.valueOf(status.trim().toUpperCase(Locale.ROOT));
            } catch (IllegalArgumentException e) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Status de entrega invalido");
            }
        }
        EntregaStatus filtroStatus = statusEnum;
        Integer filtroProjeto = projetoId;

        return entregasDoEscopo(usuario).stream()
                .filter(e -> filtroStatus == null || e.getStatus() == filtroStatus)
                .filter(e -> filtroProjeto == null || e.getProjeto().getId().equals(filtroProjeto))
                .sorted(Comparator.comparing(OrientadorService::entregaAtualizadaEm,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::entregaResponse)
                .toList();
    }

    private static OffsetDateTime entregaAtualizadaEm(ProjectDelivery entrega) {
        return entrega.getAtualizadaEm() != null ? entrega.getAtualizadaEm() : entrega.getCriadaEm();
    }

    private EntregaResponse entregaResponse(ProjectDelivery entrega) {
        Long ultimaVersaoId = deliveryVersionRepository.findFirstByEntregaIdOrderByNumeroVersaoDesc(entrega.getId())
                .map(DeliveryVersion::getId)
                .orElse(null);
        int totalVersoes = deliveryVersionRepository.findByEntregaIdOrderByNumeroVersaoAsc(entrega.getId()).size();
        return EntregaResponse.fromEntity(entrega, ultimaVersaoId, totalVersoes);
    }

    @Transactional(readOnly = true)
    public List<InscricaoResponse> inscricoes(String status, Integer projetoId) {
        Usuario usuario = authHelper.getCurrentUser();
        exigirPerfilAcademico(usuario);

        StatusInscricao statusEnum = null;
        if (status != null && !status.isBlank()) {
            try {
                statusEnum = StatusInscricao.valueOf(status.trim().toUpperCase(Locale.ROOT));
            } catch (IllegalArgumentException e) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Status de inscricao invalido");
            }
        }
        StatusInscricao filtroStatus = statusEnum;
        Integer filtroProjeto = projetoId;

        return inscricoesDoEscopo(usuario).stream()
                .filter(i -> !inscricaoDoCriadorDoProjeto(i))
                .filter(i -> filtroStatus == null || i.getStatus() == filtroStatus)
                .filter(i -> filtroProjeto == null || i.getProjeto().getId().equals(filtroProjeto))
                .sorted(Comparator.comparing(Inscricao::getDataInscricao,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .map(InscricaoResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<OrientandoResponse> orientandos(String busca, String situacao, Integer projetoId) {
        Usuario usuario = authHelper.getCurrentUser();
        exigirPerfilAcademico(usuario);

        List<Projeto> projetos = projetosDoEscopo(usuario);
        List<Projeto> ativos = projetos.stream()
                .filter(p -> p.getStatus() == StatusProjeto.ABERTO
                        || p.getStatus() == StatusProjeto.EM_ANDAMENTO)
                .toList();
        Map<Integer, List<EtapaProgresso>> etapasPorProjeto = carregarEtapasPorProjeto(projetos);

        List<OrientandoResponse> resultado = inscricoesDoEscopo(usuario).stream()
                .filter(i -> i.getStatus() == StatusInscricao.APROVADO)
                .filter(i -> projetoId == null || i.getProjeto().getId().equals(projetoId))
                .collect(Collectors.groupingBy(i -> i.getAluno().getId(),
                        LinkedHashMap::new, Collectors.toList()))
                .values().stream()
                .map(lista -> montarOrientando(lista, ativos, etapasPorProjeto))
                .filter(o -> busca == null || busca.isBlank()
                        || contemIgnoreCase(o.getNome(), busca)
                        || contemIgnoreCase(o.getEmail(), busca))
                .filter(o -> situacao == null || situacao.isBlank()
                        || situacao.trim().equalsIgnoreCase(o.getSituacao()))
                .toList();

        return resultado;
    }

    @Transactional(readOnly = true)
    public OrientandoDetalheResponse detalheOrientando(Integer alunoId, Integer projetoId) {
        Usuario usuario = authHelper.getCurrentUser();
        exigirPerfilAcademico(usuario);

        Aluno aluno = alunoRepository.findById(alunoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Aluno nao encontrado"));

        List<Projeto> projetos = projetosDoEscopo(usuario);
        Set<Integer> idsProjetosEscopo = projetos.stream().map(Projeto::getId)
                .collect(Collectors.toSet());

        List<Inscricao> vinculadas = inscricoesDoEscopo(usuario).stream()
                .filter(i -> i.getStatus() == StatusInscricao.APROVADO)
                .filter(i -> i.getAluno().getId().equals(alunoId))
                .toList();

        if (vinculadas.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                    "Aluno nao e orientando deste orientador");
        }

        Inscricao projetoSelecionado = null;
        if (projetoId != null) {
            projetoSelecionado = vinculadas.stream()
                    .filter(i -> i.getProjeto().getId().equals(projetoId))
                    .findFirst()
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN,
                            "Sem permissao para acessar dados deste aluno"));
            if (!idsProjetosEscopo.contains(projetoId)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Sem permissao para acessar dados deste aluno");
            }
        } else {
            projetoSelecionado = vincularProjetoPreferido(vinculadas);
        }

        Projeto projeto = projetoSelecionado.getProjeto();
        List<EtapaProgresso> etapas = etapaProgressoRepository.findByProjetoIdOrderByOrdemAsc(projeto.getId());
        List<Progresso> historico = progressoRepository
                .findByProjetoIdAndAutorIdOrderByDataRegistroDesc(projeto.getId(), aluno.getUsuario().getId());

        return OrientandoDetalheResponse.builder()
                .alunoId(aluno.getId())
                .alunoUsuarioId(aluno.getUsuario().getId())
                .nome(aluno.getUsuario().getNome())
                .email(aluno.getUsuario().getEmail())
                .fotoPerfilUrl(usuarioService.resolverFotoPerfilParaExibicao(aluno.getUsuario().getFotoPerfilUrl()))
                .ra(aluno.getRa())
                .curso(aluno.getCurso() != null ? aluno.getCurso().getNome() : null)
                .semestre(aluno.getSemestre())
                .interesses(aluno.getInteresses())
                .projetos(vinculadas.stream().map(i -> OrientandoProjetoResumo.builder()
                                .projetoId(i.getProjeto().getId())
                                .projetoTitulo(i.getProjeto().getTitulo())
                                .status(i.getProjeto().getStatus())
                                .build())
                        .toList())
                .projetoSelecionado(OrientandoProjetoResumo.builder()
                        .projetoId(projeto.getId())
                        .projetoTitulo(projeto.getTitulo())
                        .status(projeto.getStatus())
                        .build())
                .progresso(calcularPercentual(etapas))
                .etapas(etapas.stream().map(OrientadorService::etapaResponse).toList())
                .historico(historico.stream().map(OrientadorService::historicoResponse).toList())
                .build();
    }

    @Transactional(readOnly = true)
    public OrientadorPerfilResponse perfil() {
        Usuario usuarioAutenticado = authHelper.getCurrentUser();
        exigirPerfilAcademico(usuarioAutenticado);

        Usuario usuario = usuarioRepository.findById(usuarioAutenticado.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario nao encontrado"));
        Orientador orientador = orientadorRepository.findByUsuarioId(usuario.getId()).orElse(null);
        List<Projeto> projetos = projetosDoEscopo(usuario);
        List<Projeto> ativos = projetos.stream()
                .filter(p -> p.getStatus() == StatusProjeto.ABERTO
                        || p.getStatus() == StatusProjeto.EM_ANDAMENTO)
                .toList();
        List<Inscricao> inscricoes = inscricoesDoEscopo(usuario);
        long orientandos = orientandosAtivos(inscricoes, ativos).size();
        long avaliacoes = avaliacoesDoEscopo(usuario).size();

        OrientadorPerfilResponse response = OrientadorPerfilResponse.from(usuario, orientador, projetos.size(), orientandos, avaliacoes);
        response.setFotoPerfilUrl(usuarioService.resolverFotoPerfilParaExibicao(usuario.getFotoPerfilUrl()));
        return response;
    }

    @Transactional
    public OrientadorPerfilResponse atualizarPerfil(OrientadorPerfilRequest request) {
        Usuario usuario = authHelper.getCurrentUser();
        exigirPerfilAcademico(usuario);

        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Dados do perfil obrigatorios");
        }
        if (request.getNome() == null || request.getNome().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nome e obrigatorio");
        }
        if (request.getEmail() == null || request.getEmail().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email e obrigatorio");
        }

        UsuarioRequest usuarioRequest = UsuarioRequest.builder()
                .nome(request.getNome().trim())
                .email(request.getEmail().trim().toLowerCase())
                .instituicao(request.getInstituicao())
                .bio(request.getBio())
                .fotoPerfilUrl(request.getFotoPerfilUrl())
                .departamento(request.getDepartamento())
                .titulacao(request.getTitulacao())
                .build();

        usuarioService.update(usuario.getId(), usuarioRequest);
        return perfil();
    }

    private OrientandoResponse montarOrientando(List<Inscricao> vinculadas,
                                                List<Projeto> ativos,
                                                Map<Integer, List<EtapaProgresso>> etapasPorProjeto) {
        Inscricao primeira = vinculadas.get(0);
        Aluno aluno = primeira.getAluno();

        List<OrientandoProjetoResumo> projetos = vinculadas.stream()
                .map(i -> OrientandoProjetoResumo.builder()
                        .projetoId(i.getProjeto().getId())
                        .projetoTitulo(i.getProjeto().getTitulo())
                        .status(i.getProjeto().getStatus())
                        .build())
                .toList();

        String situacao = situacaoDosProjetos(projetos);
        boolean ativo = ativos.stream().anyMatch(p -> projetos.stream()
                .anyMatch(pr -> pr.getProjetoId().equals(p.getId())));

        long pendencias = vinculadas.stream()
                .map(i -> etapasPorProjeto.getOrDefault(i.getProjeto().getId(), List.of()))
                .flatMap(List::stream)
                .filter(OrientadorService::estaAtrasada)
                .count();

        int progresso = vinculadas.stream()
                .map(i -> calcularPercentual(etapasPorProjeto.getOrDefault(i.getProjeto().getId(), List.of())))
                .reduce(0, Integer::sum)
                / Math.max(vinculadas.size(), 1);

        return OrientandoResponse.builder()
                .alunoId(aluno.getId())
                .alunoUsuarioId(aluno.getUsuario().getId())
                .nome(aluno.getUsuario().getNome())
                .email(aluno.getUsuario().getEmail())
                .fotoPerfilUrl(usuarioService.resolverFotoPerfilParaExibicao(aluno.getUsuario().getFotoPerfilUrl()))
                .ra(aluno.getRa())
                .curso(aluno.getCurso() != null ? aluno.getCurso().getNome() : null)
                .situacao(ativo ? situacao : "INATIVO")
                .progresso(progresso)
                .pendencias(pendencias)
                .projetos(projetos)
                .build();
    }

    private String situacaoDosProjetos(List<OrientandoProjetoResumo> projetos) {
        if (projetos.stream().anyMatch(p -> p.getStatus() == StatusProjeto.EM_ANDAMENTO)) {
            return "EM_ANDAMENTO";
        }
        if (projetos.stream().anyMatch(p -> p.getStatus() == StatusProjeto.ABERTO)) {
            return "ABERTO";
        }
        if (projetos.stream().anyMatch(p -> p.getStatus() == StatusProjeto.FINALIZADO)) {
            return "FINALIZADO";
        }
        return "INATIVO";
    }

    private Inscricao vincularProjetoPreferido(List<Inscricao> vinculadas) {
        Comparator<Inscricao> preferencia = Comparator
                .comparingInt((Inscricao i) -> rankPreferenciaProjeto(i.getProjeto().getStatus()))
                .thenComparing(Inscricao::getDataInscricao,
                        Comparator.nullsLast(Comparator.reverseOrder()));
        return vinculadas.stream().min(preferencia).orElseThrow();
    }

    private static int rankPreferenciaProjeto(StatusProjeto status) {
        return switch (status) {
            case EM_ANDAMENTO -> 0;
            case ABERTO -> 1;
            case FINALIZADO -> 2;
            default -> 3;
        };
    }

    private Map<Integer, List<EtapaProgresso>> carregarEtapasPorProjeto(List<Projeto> projetos) {
        Map<Integer, List<EtapaProgresso>> mapa = new LinkedHashMap<>();
        for (Projeto projeto : projetos) {
            List<EtapaProgresso> etapas = etapaProgressoRepository.findByProjetoIdOrderByOrdemAsc(projeto.getId());
            if (!etapas.isEmpty()) {
                mapa.put(projeto.getId(), etapas);
            }
        }
        return mapa;
    }

    private Integer calcularPercentual(List<EtapaProgresso> etapas) {
        int pesoTotal = etapas.stream().mapToInt(e -> e.getPeso() == null ? 0 : e.getPeso()).sum();
        if (pesoTotal == 0) {
            return 0;
        }
        int pesoConcluido = etapas.stream()
                .filter(e -> e.getStatus() == EtapaProgressoStatus.DONE)
                .mapToInt(e -> e.getPeso() == null ? 0 : e.getPeso())
                .sum();
        return (int) Math.round(pesoConcluido * 100.0 / pesoTotal);
    }

    private static boolean estaAtrasada(EtapaProgresso etapa) {
        return etapa.getPrazo() != null
                && etapa.getStatus() != EtapaProgressoStatus.DONE
                && etapa.getStatus() != EtapaProgressoStatus.REJECTED
                && etapa.getPrazo().isBefore(OffsetDateTime.now());
    }

    private static boolean inscricaoDoCriadorDoProjeto(Inscricao inscricao) {
        if (inscricao == null || inscricao.getAluno() == null || inscricao.getProjeto() == null) {
            return false;
        }
        Aluno criador = inscricao.getProjeto().getAlunoCriador();
        if (criador == null || criador.getUsuario() == null || inscricao.getAluno().getUsuario() == null) {
            return false;
        }
        return criador.getUsuario().getId().equals(inscricao.getAluno().getUsuario().getId());
    }

    private static boolean contemIgnoreCase(String valor, String termo) {
        return valor != null && valor.toLowerCase(Locale.ROOT).contains(termo.trim().toLowerCase(Locale.ROOT));
    }

    private static <T> List<OrientadorDashboardQueueItem> fila(List<T> itens,
                                                               Function<T, OrientadorDashboardQueueItem> mapeador) {
        List<OrientadorDashboardQueueItem> fila = new ArrayList<>(Math.min(itens.size(), LIMITE_FILA));
        for (T item : itens) {
            if (fila.size() >= LIMITE_FILA) {
                break;
            }
            OrientadorDashboardQueueItem dto = mapeador.apply(item);
            if (dto != null) {
                fila.add(dto);
            }
        }
        return fila;
    }

    private static OrientadorDashboardQueueItem projetoQueueItem(Projeto projeto) {
        return OrientadorDashboardQueueItem.builder()
                .id(projeto.getId().longValue())
                .titulo(projeto.getTitulo())
                .subtitulo("Vagas: " + (projeto.getVagas() == null ? "-" : projeto.getVagas()))
                .destino("/app/projects/" + projeto.getId())
                .status(projeto.getStatus().name())
                .build();
    }

    private static OrientadorDashboardQueueItem solicitacaoQueueItem(Projeto projeto) {
        String autor = projeto.getAlunoCriador() != null
                && projeto.getAlunoCriador().getUsuario() != null
                ? projeto.getAlunoCriador().getUsuario().getNome()
                : "Aluno";
        return OrientadorDashboardQueueItem.builder()
                .id(projeto.getId().longValue())
                .titulo(projeto.getTitulo())
                .subtitulo(autor)
                .destino("/app/projects/" + projeto.getId())
                .status(StatusProjeto.PENDENTE_ORIENTADOR.name())
                .build();
    }

    private static OrientadorDashboardQueueItem inscricaoPendenteQueueItem(Inscricao inscricao) {
        String aluno = inscricao.getAluno() != null && inscricao.getAluno().getUsuario() != null
                ? inscricao.getAluno().getUsuario().getNome()
                : "Aluno";
        return OrientadorDashboardQueueItem.builder()
                .id(inscricao.getId().longValue())
                .titulo(aluno)
                .subtitulo(inscricao.getProjeto().getTitulo())
                .destino("/app/projects/" + inscricao.getProjeto().getId() + "/applications")
                .status(StatusInscricao.PENDENTE.name())
                .build();
    }

    private static OrientadorDashboardQueueItem orientandoQueueItem(Aluno aluno) {
        return OrientadorDashboardQueueItem.builder()
                .id(aluno.getId().longValue())
                .titulo(aluno.getUsuario().getNome())
                .subtitulo(aluno.getRa())
                .destino("/app/advisees/" + aluno.getId())
                .build();
    }

    private static OrientadorDashboardQueueItem etapaAtrasadaQueueItem(EtapaProgresso etapa) {
        return OrientadorDashboardQueueItem.builder()
                .id(etapa.getId().longValue())
                .titulo(etapa.getTitulo())
                .subtitulo(etapa.getProjeto().getTitulo() + " - prazo " + etapa.getPrazo())
                .destino("/app/projects/" + etapa.getProjeto().getId())
                .status(etapa.getStatus().name())
                .build();
    }

    private static OrientadorDashboardQueueItem entregaQueueItem(ProjectDelivery entrega) {
        String autor = entrega.getAutor() != null ? entrega.getAutor().getNome() : "Aluno";
        return OrientadorDashboardQueueItem.builder()
                .id(entrega.getId())
                .titulo(entrega.getTitulo())
                .subtitulo(autor + " - " + entrega.getProjeto().getTitulo())
                .destino("/app/projects/" + entrega.getProjeto().getId() + "/deliveries")
                .status(EntregaStatus.PENDING_REVIEW.name())
                .build();
    }

    private static OrientadorDashboardQueueItem avaliacaoQueueItem(AcademicEvaluation avaliacao) {
        String aluno = avaliacao.getAluno() != null && avaliacao.getAluno().getUsuario() != null
                ? avaliacao.getAluno().getUsuario().getNome()
                : "Aluno";
        return OrientadorDashboardQueueItem.builder()
                .id(avaliacao.getId())
                .titulo(aluno)
                .subtitulo(avaliacao.getProjeto().getTitulo()
                        + (avaliacao.getEtapa() != null ? " - " + avaliacao.getEtapa().getTitulo() : ""))
                .destino("/app/projects/" + avaliacao.getProjeto().getId() + "/evaluations")
                .build();
    }

    private static OrientandoEtapaResponse etapaResponse(EtapaProgresso etapa) {
        return OrientandoEtapaResponse.builder()
                .id(etapa.getId())
                .titulo(etapa.getTitulo())
                .descricao(etapa.getDescricao())
                .ordem(etapa.getOrdem())
                .peso(etapa.getPeso())
                .obrigatoria(etapa.getObrigatoria())
                .status(etapa.getStatus())
                .responsavel(etapa.getResponsavel())
                .prazo(etapa.getPrazo())
                .concluidaEm(etapa.getConcluidaEm())
                .concluidaPorNome(etapa.getConcluidaPor() != null ? etapa.getConcluidaPor().getNome() : null)
                .build();
    }

    private static OrientandoHistoricoResponse historicoResponse(Progresso progresso) {
        return OrientandoHistoricoResponse.builder()
                .id(progresso.getId())
                .titulo(progresso.getTitulo())
                .descricao(progresso.getDescricao())
                .categoria(progresso.getCategoria())
                .dataRegistro(progresso.getDataRegistro())
                .build();
    }

    private Set<Aluno> orientandosAtivos(List<Inscricao> inscricoes, List<Projeto> ativos) {
        Set<Integer> idsAtivos = ativos.stream().map(Projeto::getId).collect(Collectors.toSet());
        Set<Aluno> orientandos = new LinkedHashSet<>();
        for (Inscricao inscricao : inscricoes) {
            if (inscricao.getStatus() == StatusInscricao.APROVADO
                    && idsAtivos.contains(inscricao.getProjeto().getId())) {
                orientandos.add(inscricao.getAluno());
            }
        }
        return orientandos;
    }

    private List<Projeto> projetosDoEscopo(Usuario usuario) {
        if (usuario.getTipo() == TipoUsuario.ADMIN) {
            return projetoRepository.findAll();
        }
        return projetoRepository.findByOrientadorUsuarioId(usuario.getId());
    }

    private List<Inscricao> inscricoesDoEscopo(Usuario usuario) {
        if (usuario.getTipo() == TipoUsuario.ADMIN) {
            return inscricaoRepository.findAll();
        }
        return inscricaoRepository.findByProjetoOrientadorUsuarioId(usuario.getId());
    }

    private List<EtapaProgresso> etapasDoEscopo(Usuario usuario) {
        if (usuario.getTipo() == TipoUsuario.ADMIN) {
            return etapaProgressoRepository.findAll();
        }
        return etapaProgressoRepository.findByProjetoOrientadorUsuarioId(usuario.getId());
    }

    private List<ProjectDelivery> entregasDoEscopo(Usuario usuario) {
        if (usuario.getTipo() == TipoUsuario.ADMIN) {
            return projectDeliveryRepository.findAll();
        }
        return projectDeliveryRepository.findByProjetoOrientadorUsuarioId(usuario.getId());
    }

    private List<AcademicEvaluation> avaliacoesDoEscopo(Usuario usuario) {
        if (usuario.getTipo() == TipoUsuario.ADMIN) {
            return academicEvaluationRepository.findAll();
        }
        return academicEvaluationRepository.findByProjetoOrientadorUsuarioId(usuario.getId());
    }

    private void exigirPerfilAcademico(Usuario usuario) {
        if (usuario.getTipo() != TipoUsuario.ORIENTADOR && usuario.getTipo() != TipoUsuario.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Acesso restrito ao orientador");
        }
    }
}
