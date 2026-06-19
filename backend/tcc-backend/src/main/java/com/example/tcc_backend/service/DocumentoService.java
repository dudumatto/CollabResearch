package com.example.tcc_backend.service;

import com.example.tcc_backend.model.Documento;
import com.example.tcc_backend.model.StatusDocumento;
import com.example.tcc_backend.model.TipoDocumento;
import com.example.tcc_backend.model.TipoUsuario;
import com.example.tcc_backend.model.Usuario;
import com.example.tcc_backend.repository.DocumentoRepository;
import com.example.tcc_backend.repository.UsuarioRepository;
import com.example.tcc_backend.security.AuthHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.URISyntaxException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DocumentoService {

    private static final Map<String, List<String>> EXTENSOES_PERMITIDAS = Map.of(
            "application/pdf", List.of(".pdf"),
            "application/msword", List.of(".doc"),
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document", List.of(".docx")
    );

    private static final long MAX_FILE_BYTES = 10L * 1024 * 1024; // 10MB (alinhado com application.properties)

    private final DocumentoRepository documentoRepository;
    private final UsuarioRepository usuarioRepository;
    private final AuthHelper authHelper;

    public Documento upload(Integer usuarioId, TipoDocumento tipo, MultipartFile arquivo) {
        if (usuarioId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "usuarioId obrigatorio");
        }

        Usuario usuarioLogado = authHelper.getCurrentUser();
        if (usuarioLogado == null || usuarioLogado.getId() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Nao autenticado");
        }

        if (!usuarioLogado.getId().equals(usuarioId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Sem permissao para enviar documento para outro usuario");
        }

        if (arquivo != null && arquivo.getSize() > MAX_FILE_BYTES) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "Arquivo muito grande");
        }

        if (tipo == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tipo do documento obrigatório");
        }

        if (arquivo == null || arquivo.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Arquivo obrigatório");
        }

        // 1. Em vez de usar o authHelper (que pegaria o Admin),
        // nós buscamos o usuário pelo ID que veio do React
        Usuario usuarioAlvo = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuário não encontrado"));

        // 2. Salva o arquivo na pasta correta desse usuário
        String caminho = salvarArquivo(usuarioAlvo, arquivo);

        // 3. Monta o documento vinculando ao usuário alvo
        Documento documento = Documento.builder()
                .usuario(usuarioAlvo)
                .tipo(tipo)
                .nomeArquivo(sanitizarNomeOriginal(arquivo.getOriginalFilename()))
                .status(StatusDocumento.ENVIADO)
                .caminho(caminho)
                .build();

        return documentoRepository.save(documento);
    }

    public Documento upload(Integer usuarioId, TipoDocumento tipo, String nomeArquivo, String url) {
        if (usuarioId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "usuarioId obrigatorio");
        }

        Usuario usuarioLogado = authHelper.getCurrentUser();
        if (usuarioLogado == null || usuarioLogado.getId() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Nao autenticado");
        }

        if (!usuarioLogado.getId().equals(usuarioId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Sem permissao para enviar documento para outro usuario");
        }

        if (tipo == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tipo do documento obrigatorio");
        }

        String nomeSeguro = sanitizarNomeOriginal(nomeArquivo);
        if (nomeSeguro == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "nomeArquivo obrigatorio");
        }

        String urlValidada = validarUrlDocumento(url);

        Usuario usuarioAlvo = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario nao encontrado"));

        Documento documento = Documento.builder()
                .usuario(usuarioAlvo)
                .tipo(tipo)
                .nomeArquivo(nomeSeguro)
                .status(StatusDocumento.ENVIADO)
                .caminho(urlValidada)
                .build();

        return documentoRepository.save(documento);
    }

    public List<Documento> listarPorUsuario(Integer usuarioId) {
        if (usuarioId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "usuarioId obrigatorio");
        }

        Usuario usuarioLogado = authHelper.getCurrentUser();
        if (usuarioLogado == null || usuarioLogado.getId() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Nao autenticado");
        }

        // Removemos a verificação do authHelper que bloqueava o Admin
        // Agora ele simplesmente vai no banco e devolve os arquivos do usuário
        if (!usuarioLogado.getId().equals(usuarioId) && usuarioLogado.getTipo() != TipoUsuario.ADMIN) {
            return documentoRepository.findByUsuarioIdAndTipo(usuarioId, TipoDocumento.CURRICULO);
        }

        return documentoRepository.findByUsuarioId(usuarioId);
    }

    public void remover(Integer id) {
        Documento documento = buscarDocumentoParaEdicao(id);

        if (!isRemoteUrl(documento.getCaminho())) {
            apagarArquivo(documento.getCaminho());
        }
        documentoRepository.delete(documento);
    }

    public Documento buscarDocumentoDoUsuario(Integer id) {
        Usuario usuarioLogado = authHelper.getCurrentUser();
        if (usuarioLogado == null || usuarioLogado.getId() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Nao autenticado");
        }
        Documento documento = documentoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Documento nao encontrado"));
        boolean isDono = documento.getUsuario() != null && documento.getUsuario().getId().equals(usuarioLogado.getId());
        if (!isDono && usuarioLogado.getTipo() != TipoUsuario.ADMIN && documento.getTipo() != TipoDocumento.CURRICULO) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Sem permissao para acessar este documento");
        }
        return documento;
    }

    private Documento buscarDocumentoParaEdicao(Integer id) {
        Usuario usuarioLogado = authHelper.getCurrentUser();
        if (usuarioLogado == null || usuarioLogado.getId() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Nao autenticado");
        }
        Documento documento = documentoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Documento nao encontrado"));

        if (!documento.getUsuario().getId().equals(usuarioLogado.getId())
                && usuarioLogado.getTipo() != TipoUsuario.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Sem permissao para acessar este documento");
        }
        return documento;
    }

    public Path obterArquivo(Integer id) {
        Documento documento = buscarDocumentoDoUsuario(id);
        Path caminho = Path.of(documento.getCaminho()).toAbsolutePath().normalize();
        Path baseDir = Path.of("uploads", "documentos").toAbsolutePath().normalize();
        if (!caminho.startsWith(baseDir)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Arquivo do documento nao encontrado");
        }
        if (!Files.exists(caminho)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Arquivo do documento nao encontrado");
        }
        return caminho;
    }

    public Documento obterDocumento(Integer id) {
        return buscarDocumentoDoUsuario(id);
    }

    public String obterUrlDocumento(Integer id) {
        Documento documento = buscarDocumentoDoUsuario(id);
        String url = documento.getCaminho();
        if (!isRemoteUrl(url)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "URL do documento nao encontrada");
        }
        return url;
    }

    private String salvarArquivo(Usuario usuario, MultipartFile arquivo) {
        try {
            String extensao = validarArquivo(arquivo);
            Path dir = Path.of("uploads", "documentos", usuario.getId().toString());
            Files.createDirectories(dir);
            String nomeArquivo = UUID.randomUUID() + extensao;
            Path destino = dir.resolve(nomeArquivo);
            Files.copy(arquivo.getInputStream(), destino, StandardCopyOption.REPLACE_EXISTING);
            return destino.toString();
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Falha ao salvar arquivo");
        }
    }

    private String validarArquivo(MultipartFile arquivo) {
        String contentType = arquivo.getContentType();
        if (contentType == null || !EXTENSOES_PERMITIDAS.containsKey(contentType)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tipo de arquivo nao permitido");
        }

        String nomeOriginal = arquivo.getOriginalFilename() == null
                ? ""
                : Path.of(arquivo.getOriginalFilename()).getFileName().toString().toLowerCase(Locale.ROOT);

        for (String extensao : EXTENSOES_PERMITIDAS.get(contentType)) {
            if (nomeOriginal.endsWith(extensao)) {
                validarAssinaturaMinima(arquivo, contentType);
                return extensao;
            }
        }

        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Extensao de arquivo nao permitida");
    }

    private void validarAssinaturaMinima(MultipartFile arquivo, String contentType) {
        byte[] header = new byte[8];
        int read;
        try (InputStream in = arquivo.getInputStream()) {
            read = in.read(header);
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Arquivo invalido");
        }

        if (read <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Arquivo invalido");
        }

        if ("application/pdf".equals(contentType)) {
            byte[] pdf = new byte[]{'%', 'P', 'D', 'F', '-'};
            if (read < pdf.length || !Arrays.equals(Arrays.copyOf(header, pdf.length), pdf)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Arquivo invalido");
            }
            return;
        }

        if ("application/vnd.openxmlformats-officedocument.wordprocessingml.document".equals(contentType)) {
            // DOCX e ZIP (PK..)
            if (read < 2 || header[0] != 'P' || header[1] != 'K') {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Arquivo invalido");
            }
            return;
        }

        if ("application/msword".equals(contentType)) {
            // DOC (OLE2) D0 CF 11 E0 A1 B1 1A E1
            byte[] ole = new byte[]{(byte) 0xD0, (byte) 0xCF, 0x11, (byte) 0xE0, (byte) 0xA1, (byte) 0xB1, 0x1A, (byte) 0xE1};
            if (read < ole.length || !Arrays.equals(Arrays.copyOf(header, ole.length), ole)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Arquivo invalido");
            }
        }
    }

    private String sanitizarNomeOriginal(String nome) {
        if (nome == null || nome.isBlank()) return null;
        String base = Path.of(nome).getFileName().toString();
        String cleaned = base.replaceAll("[\\p{Cntrl}]", "").trim();
        if (cleaned.isEmpty()) return null;
        return cleaned.length() > 255 ? cleaned.substring(0, 255) : cleaned;
    }

    private String validarUrlDocumento(String url) {
        if (url == null || url.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "url obrigatoria");
        }

        String cleaned = url.trim();
        if (cleaned.length() > 1000) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "url muito longa");
        }

        URI uri;
        try {
            uri = new URI(cleaned);
        } catch (URISyntaxException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "url invalida");
        }

        String scheme = uri.getScheme();
        String host = uri.getHost();
        if (!"https".equalsIgnoreCase(scheme) || host == null || !host.toLowerCase(Locale.ROOT).endsWith(".supabase.co")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "url do documento invalida");
        }

        return cleaned;
    }

    private boolean isRemoteUrl(String caminho) {
        if (caminho == null || caminho.isBlank()) return false;
        try {
            URI uri = new URI(caminho);
            return "http".equalsIgnoreCase(uri.getScheme()) || "https".equalsIgnoreCase(uri.getScheme());
        } catch (URISyntaxException e) {
            return false;
        }
    }

    private void apagarArquivo(String caminho) {
        try {
            Files.deleteIfExists(Path.of(caminho));
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Falha ao remover arquivo");
        }
    }
}
