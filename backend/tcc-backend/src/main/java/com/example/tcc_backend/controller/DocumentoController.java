package com.example.tcc_backend.controller;

import com.example.tcc_backend.dto.request.DocumentoUploadRequest;
import com.example.tcc_backend.dto.response.DocumentoResponse;
import com.example.tcc_backend.model.Documento;
import com.example.tcc_backend.service.DocumentoService;
import com.example.tcc_backend.service.SupabaseStorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.MultipartException;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

@RestController
@RequestMapping("/api/documentos")
@RequiredArgsConstructor
@Tag(name = "Documentos", description = "Endpoints para gerenciamento de arquivos")
public class DocumentoController {

    private final DocumentoService documentoService;
    private final SupabaseStorageService supabaseStorageService;

    @Operation(summary = "Upload de documento", description = "Salva os metadados de um documento enviado ao Supabase Storage.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Documento registrado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados invalidos")
    })
    @PostMapping(value = "/upload", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<DocumentoResponse> upload(@RequestBody @Valid DocumentoUploadRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(DocumentoResponse.fromEntity(documentoService.upload(
                        request.getUsuarioId(),
                        request.getTipo(),
                        request.getNomeArquivo(),
                        request.getUrl()
                )));
    }

    @Operation(summary = "Download de documento", description = "Redireciona documentos remotos ou entrega arquivos locais autenticados.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Arquivo local retornado com sucesso"),
            @ApiResponse(responseCode = "302", description = "Redirecionamento realizado com sucesso"),
            @ApiResponse(responseCode = "404", description = "Documento nao encontrado")
    })
    @GetMapping("/{id}/download")
    public ResponseEntity<?> download(@PathVariable Integer id) {
        validarId(id);
        Documento documento = documentoService.obterDocumento(id);
        if (isRemoteUrl(documento.getCaminho())) {
            return ResponseEntity.status(HttpStatus.FOUND)
                    .location(URI.create(remoteDocumentUrl(documento.getCaminho())))
                    .build();
        }
        return arquivoLocal(id, documento.getNomeArquivo(), false);
    }

    @Operation(summary = "Preview de documento", description = "Redireciona documentos remotos ou entrega arquivos locais autenticados para visualizacao.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Arquivo local retornado com sucesso"),
            @ApiResponse(responseCode = "302", description = "Redirecionamento realizado com sucesso"),
            @ApiResponse(responseCode = "404", description = "Documento nao encontrado")
    })
    @GetMapping("/{id}/preview")
    public ResponseEntity<?> preview(@PathVariable Integer id) {
        validarId(id);
        Documento documento = documentoService.obterDocumento(id);
        if (isRemoteUrl(documento.getCaminho())) {
            return ResponseEntity.status(HttpStatus.FOUND)
                    .location(URI.create(remoteDocumentUrl(documento.getCaminho())))
                    .build();
        }
        return arquivoLocal(id, documento.getNomeArquivo(), true);
    }

    @Operation(summary = "Listar documentos do usuario", description = "Retorna todos os documentos de um usuario.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Lista retornada com sucesso")
    })
    @GetMapping("/usuario/{usuarioId}")
    public ResponseEntity<List<DocumentoResponse>> listarDoUsuario(@PathVariable Integer usuarioId) {
        if (usuarioId == null || usuarioId <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "usuarioId invalido");
        }
        return ResponseEntity.ok(
                documentoService.listarPorUsuario(usuarioId)
                        .stream()
                        .map(DocumentoResponse::fromEntity)
                        .toList()
        );
    }

    @Operation(summary = "Buscar documento por ID", description = "Retorna os dados de um documento.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Documento encontrado"),
            @ApiResponse(responseCode = "400", description = "ID invalido"),
            @ApiResponse(responseCode = "404", description = "Documento nao encontrado")
    })
    @GetMapping("/{id}")
    public ResponseEntity<DocumentoResponse> buscarPorId(@PathVariable Integer id) {
        validarId(id);
        return ResponseEntity.ok(
                DocumentoResponse.fromEntity(documentoService.obterDocumento(id))
        );
    }

    @Operation(summary = "Remover documento", description = "Remove um documento do sistema.")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Documento removido com sucesso"),
            @ApiResponse(responseCode = "404", description = "Documento nao encontrado")
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        validarId(id);
        documentoService.remover(id);
        return ResponseEntity.noContent().build();
    }

    @ExceptionHandler({MaxUploadSizeExceededException.class, MultipartException.class})
    public ResponseEntity<String> handleUploadTooLarge(Exception ex) {
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE).body("Arquivo muito grande");
    }

    private void validarId(Integer id) {
        if (id == null || id <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ID invalido");
        }
    }

    private String remoteDocumentUrl(String caminho) {
        String signedUrl = supabaseStorageService.createSignedUrlFromPublicUrl(caminho);
        return signedUrl == null || signedUrl.isBlank() ? caminho : signedUrl;
    }

    private ResponseEntity<Resource> arquivoLocal(Integer id, String nomeArquivo, boolean inline) {
        try {
            Path arquivo = documentoService.obterArquivo(id);
            Resource resource = new UrlResource(arquivo.toUri());
            String contentType = Files.probeContentType(arquivo);
            MediaType mediaType = contentType == null
                    ? MediaType.APPLICATION_OCTET_STREAM
                    : MediaType.parseMediaType(contentType);
            String nome = nomeArquivo == null || nomeArquivo.isBlank()
                    ? arquivo.getFileName().toString()
                    : nomeArquivo;
            ContentDisposition disposition = (inline ? ContentDisposition.inline() : ContentDisposition.attachment())
                    .filename(nome, StandardCharsets.UTF_8)
                    .build();

            return ResponseEntity.ok()
                    .contentType(mediaType)
                    .contentLength(Files.size(arquivo))
                    .header("Content-Disposition", disposition.toString())
                    .body(resource);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Arquivo do documento nao encontrado");
        }
    }

    private boolean isRemoteUrl(String caminho) {
        if (caminho == null || caminho.isBlank()) return false;
        return caminho.startsWith("http://") || caminho.startsWith("https://");
    }
}





