package com.example.tcc_backend.service;

import com.example.tcc_backend.dto.request.DeliveryReviewRequest;
import com.example.tcc_backend.dto.request.EntregaRequest;
import com.example.tcc_backend.dto.response.DeliveryReviewResponse;
import com.example.tcc_backend.dto.response.DeliveryVersionResponse;
import com.example.tcc_backend.dto.response.EntregaResponse;
import com.example.tcc_backend.model.*;
import com.example.tcc_backend.repository.DeliveryReviewRepository;
import com.example.tcc_backend.repository.DeliveryVersionRepository;
import com.example.tcc_backend.repository.EtapaProgressoRepository;
import com.example.tcc_backend.repository.ProjectDeliveryRepository;
import com.example.tcc_backend.repository.ProjetoRepository;
import com.example.tcc_backend.security.AuthHelper;
import com.example.tcc_backend.security.ProjectAccessPolicy;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EntregaService {

    private static final Map<String, List<String>> EXTENSOES_PERMITIDAS = Map.of(
            "application/pdf", List.of(".pdf"),
            "application/msword", List.of(".doc"),
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document", List.of(".docx"),
            "text/plain", List.of(".txt"),
            "application/zip", List.of(".zip")
    );

    private static final long MAX_FILE_BYTES = 10L * 1024 * 1024;

    private final ProjectDeliveryRepository projectDeliveryRepository;
    private final DeliveryVersionRepository deliveryVersionRepository;
    private final DeliveryReviewRepository deliveryReviewRepository;
    private final ProjetoRepository projetoRepository;
    private final EtapaProgressoRepository etapaProgressoRepository;
    private final AuthHelper authHelper;
    private final ProjectAccessPolicy projectAccessPolicy;
    private final SupabaseStorageService supabaseStorageService;

    @Transactional
    public EntregaResponse criar(Integer projetoId, EntregaRequest request, MultipartFile arquivo) {
        Usuario usuarioLogado = authHelper.getCurrentUser();
        Projeto projeto = carregarProjeto(projetoId);
        projectAccessPolicy.requireTeamMember(projeto, usuarioLogado);

        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Dados da entrega obrigatorios");
        }
        if (request.getTitulo() == null || request.getTitulo().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Titulo e obrigatorio");
        }
        if (request.getCategoria() == null || request.getCategoria().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Categoria e obrigatoria");
        }
        if (arquivo == null || arquivo.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Arquivo obrigatorio");
        }
        validarArquivo(arquivo);

        EtapaProgresso etapa = request.getEtapaId() != null
                ? etapaProgressoRepository.findByProjetoIdAndId(projetoId, request.getEtapaId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Etapa nao encontrada"))
                : null;

        ProjectDelivery entrega = ProjectDelivery.builder()
                .projeto(projeto)
                .etapa(etapa)
                .autor(usuarioLogado)
                .titulo(request.getTitulo().trim())
                .categoria(request.getCategoria().trim())
                .status(EntregaStatus.PENDING_REVIEW)
                .build();
        entrega = projectDeliveryRepository.save(entrega);

        salvarVersao(entrega, 1, arquivo);

        return toResponse(entrega);
    }

    @Transactional
    public EntregaResponse reenviar(Integer projetoId, Long entregaId, MultipartFile arquivo) {
        Usuario usuarioLogado = authHelper.getCurrentUser();
        Projeto projeto = carregarProjeto(projetoId);
        projectAccessPolicy.requireTeamMember(projeto, usuarioLogado);

        ProjectDelivery entrega = projectDeliveryRepository.findById(entregaId)
                .filter(e -> e.getProjeto().getId().equals(projetoId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Entrega nao encontrada"));

        if (!entrega.getAutor().getId().equals(usuarioLogado.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Somente o autor pode reenviar a entrega");
        }
        if (arquivo == null || arquivo.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Arquivo obrigatorio");
        }
        validarArquivo(arquivo);

        Integer proximaVersao = deliveryVersionRepository.findFirstByEntregaIdOrderByNumeroVersaoDesc(entregaId)
                .map(v -> v.getNumeroVersao() + 1)
                .orElse(1);

        salvarVersao(entrega, proximaVersao, arquivo);

        entrega.setStatus(EntregaStatus.PENDING_REVIEW);
        entrega.setAtualizadaEm(OffsetDateTime.now());
        entrega = projectDeliveryRepository.save(entrega);

        return toResponse(entrega);
    }

    @Transactional
    public DeliveryReviewResponse revisar(Integer projetoId, Long entregaId, Long versaoId, DeliveryReviewRequest request) {
        Usuario usuarioLogado = authHelper.getCurrentUser();
        Projeto projeto = carregarProjeto(projetoId);
        projectAccessPolicy.requireResponsibleAdvisor(projeto, usuarioLogado);

        ProjectDelivery entrega = projectDeliveryRepository.findById(entregaId)
                .filter(e -> e.getProjeto().getId().equals(projetoId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Entrega nao encontrada"));

        DeliveryVersion versao = deliveryVersionRepository.findById(versaoId)
                .filter(v -> v.getEntrega().getId().equals(entregaId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Versao nao encontrada"));

        DeliveryVersion ultimaVersao = deliveryVersionRepository.findFirstByEntregaIdOrderByNumeroVersaoDesc(entregaId).orElse(null);
        if (ultimaVersao == null || !ultimaVersao.getId().equals(versaoId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Apenas a versao mais recente pode ser revisada");
        }

        if (request == null || request.getDecisao() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Decisao obrigatoria");
        }

        String comentario = normalizarTexto(request.getComentario());
        if (request.getDecisao() == EntregaDecisao.CHANGES_REQUESTED && comentario == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Solicitacao de ajustes exige comentario");
        }

        if (deliveryReviewRepository.findByVersaoId(versaoId).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Esta versao ja foi revisada");
        }

        DeliveryReview revisao = DeliveryReview.builder()
                .versao(versao)
                .revisor(usuarioLogado)
                .decisao(request.getDecisao())
                .comentario(comentario)
                .build();
        revisao = deliveryReviewRepository.save(revisao);

        EntregaStatus novoStatus = request.getDecisao() == EntregaDecisao.APPROVED
                ? EntregaStatus.APPROVED
                : EntregaStatus.CHANGES_REQUESTED;
        entrega.setStatus(novoStatus);
        entrega.setAtualizadaEm(OffsetDateTime.now());
        projectDeliveryRepository.save(entrega);

        return DeliveryReviewResponse.fromEntity(revisao);
    }

    @Transactional(readOnly = true)
    public List<EntregaResponse> listar(Integer projetoId) {
        Usuario usuarioLogado = authHelper.getCurrentUser();
        Projeto projeto = carregarProjeto(projetoId);
        projectAccessPolicy.requireCanViewDeliveries(projeto, usuarioLogado);

        return projectDeliveryRepository.findByProjetoId(projetoId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<DeliveryVersionResponse> listarVersoes(Integer projetoId, Long entregaId) {
        Usuario usuarioLogado = authHelper.getCurrentUser();
        Projeto projeto = carregarProjeto(projetoId);
        projectAccessPolicy.requireCanViewDeliveries(projeto, usuarioLogado);

        projectDeliveryRepository.findById(entregaId)
                .filter(e -> e.getProjeto().getId().equals(projetoId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Entrega nao encontrada"));

        List<DeliveryVersion> versoes = deliveryVersionRepository.findByEntregaIdOrderByNumeroVersaoAsc(entregaId);
        List<DeliveryReview> revisoes = versoes.stream()
                .map(v -> deliveryReviewRepository.findByVersaoId(v.getId()).orElse(null))
                .filter(r -> r != null)
                .toList();

        return versoes.stream()
                .map(v -> DeliveryVersionResponse.fromEntity(v, revisoes))
                .toList();
    }

    public DescargaEntrega obterDescarga(Integer projetoId, Long entregaId, Long versaoId) {
        Usuario usuarioLogado = authHelper.getCurrentUser();
        Projeto projeto = carregarProjeto(projetoId);
        projectAccessPolicy.requireCanViewDeliveries(projeto, usuarioLogado);

        DeliveryVersion versao = deliveryVersionRepository.findById(versaoId)
                .filter(v -> v.getEntrega().getId().equals(entregaId))
                .filter(v -> v.getEntrega().getProjeto().getId().equals(projetoId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Versao nao encontrada"));

        String signedUrl = supabaseStorageService.createSignedUrl(versao.getCaminhoArquivo());
        if (signedUrl != null) {
            return DescargaEntrega.remota(signedUrl, versao.getNomeArquivo());
        }

        Path caminho = Path.of(versao.getCaminhoArquivo()).toAbsolutePath().normalize();
        Path baseDir = Path.of("uploads", "entregas").toAbsolutePath().normalize();
        if (!caminho.startsWith(baseDir) || !Files.exists(caminho)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Arquivo da entrega nao encontrado");
        }
        return DescargaEntrega.local(caminho, versao.getNomeArquivo(), versao.getContentType());
    }

    private void salvarVersao(ProjectDelivery entrega, Integer numeroVersao, MultipartFile arquivo) {
        String contentType = arquivo.getContentType();
        String extensao = obterExtensao(arquivo);
        String nomeSeguro = sanitizarNomeOriginal(arquivo.getOriginalFilename());

        String caminho;
        if (supabaseStorageService.isConfigured()) {
            String pasta = "projeto-" + entrega.getProjeto().getId() + "/entrega-" + entrega.getId() + "/v" + numeroVersao;
            caminho = supabaseStorageService.upload(pasta, UUID.randomUUID() + extensao, lerBytes(arquivo), contentType);
        } else {
            caminho = salvarLocal(entrega, numeroVersao, arquivo, extensao);
        }

        DeliveryVersion versao = DeliveryVersion.builder()
                .entrega(entrega)
                .numeroVersao(numeroVersao)
                .caminhoArquivo(caminho)
                .nomeArquivo(nomeSeguro)
                .contentType(contentType)
                .tamanhoBytes(arquivo.getSize())
                .build();
        deliveryVersionRepository.save(versao);
    }

    private String salvarLocal(ProjectDelivery entrega, Integer numeroVersao, MultipartFile arquivo, String extensao) {
        try {
            Path dir = Path.of("uploads", "entregas",
                    entrega.getProjeto().getId().toString(),
                    entrega.getId().toString(),
                    "v" + numeroVersao);
            Files.createDirectories(dir);
            String nomeArquivo = UUID.randomUUID() + extensao;
            Path destino = dir.resolve(nomeArquivo);
            Files.copy(arquivo.getInputStream(), destino, StandardCopyOption.REPLACE_EXISTING);
            return destino.toString();
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Falha ao salvar arquivo da entrega");
        }
    }

    private byte[] lerBytes(MultipartFile arquivo) {
        try (InputStream in = arquivo.getInputStream()) {
            return in.readAllBytes();
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Arquivo invalido");
        }
    }

    private void validarArquivo(MultipartFile arquivo) {
        if (arquivo.getSize() > MAX_FILE_BYTES) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "Arquivo muito grande");
        }

        String contentType = arquivo.getContentType();
        if (contentType == null || !EXTENSOES_PERMITIDAS.containsKey(contentType)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tipo de arquivo nao permitido");
        }

        String nomeOriginal = arquivo.getOriginalFilename() == null
                ? ""
                : Path.of(arquivo.getOriginalFilename()).getFileName().toString().toLowerCase(Locale.ROOT);
        boolean extensaoValida = EXTENSOES_PERMITIDAS.get(contentType).stream().anyMatch(nomeOriginal::endsWith);
        if (!extensaoValida) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Extensao de arquivo nao permitida");
        }
    }

    private String obterExtensao(MultipartFile arquivo) {
        String contentType = arquivo.getContentType();
        if (contentType == null) {
            return "";
        }
        List<String> extensoes = EXTENSOES_PERMITIDAS.get(contentType);
        return extensoes == null || extensoes.isEmpty() ? "" : extensoes.get(0);
    }

    private String sanitizarNomeOriginal(String nome) {
        if (nome == null || nome.isBlank()) {
            return "arquivo";
        }
        String base = Path.of(nome).getFileName().toString();
        String cleaned = base.replaceAll("[\\p{Cntrl}]", "").trim();
        if (cleaned.isEmpty()) {
            return "arquivo";
        }
        return cleaned.length() > 255 ? cleaned.substring(0, 255) : cleaned;
    }

    private String normalizarTexto(String valor) {
        if (valor == null) {
            return null;
        }
        String normalizado = valor.trim();
        return normalizado.isEmpty() ? null : normalizado;
    }

    private EntregaResponse toResponse(ProjectDelivery entrega) {
        Long ultimaVersaoId = deliveryVersionRepository.findFirstByEntregaIdOrderByNumeroVersaoDesc(entrega.getId())
                .map(DeliveryVersion::getId)
                .orElse(null);
        Integer totalVersoes = deliveryVersionRepository.findByEntregaIdOrderByNumeroVersaoAsc(entrega.getId()).size();
        return EntregaResponse.fromEntity(entrega, ultimaVersaoId, totalVersoes);
    }

    private Projeto carregarProjeto(Integer projetoId) {
        return projetoRepository.findById(projetoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Projeto nao encontrado"));
    }

    public record DescargaEntrega(String url, Path caminhoLocal, String nomeArquivo, String contentType) {
        public boolean isRemota() {
            return url != null;
        }

        public static DescargaEntrega remota(String url, String nomeArquivo) {
            return new DescargaEntrega(url, null, nomeArquivo, null);
        }

        public static DescargaEntrega local(Path caminho, String nomeArquivo, String contentType) {
            return new DescargaEntrega(null, caminho, nomeArquivo, contentType);
        }
    }
}
