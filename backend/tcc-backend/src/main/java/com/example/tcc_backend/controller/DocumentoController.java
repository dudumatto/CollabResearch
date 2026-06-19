package com.example.tcc_backend.controller;

import com.example.tcc_backend.dto.request.DocumentoUploadRequest;
import com.example.tcc_backend.dto.response.DocumentoResponse;
import com.example.tcc_backend.service.DocumentoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
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

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/documentos")
@RequiredArgsConstructor
@Tag(name = "Documentos", description = "Endpoints para gerenciamento de arquivos")
public class DocumentoController {

    private final DocumentoService documentoService;

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

    @Operation(summary = "Download de documento", description = "Redireciona para a URL publica do documento no Supabase.")
    @ApiResponses({
            @ApiResponse(responseCode = "302", description = "Redirecionamento realizado com sucesso"),
            @ApiResponse(responseCode = "404", description = "Documento nao encontrado")
    })
    @GetMapping("/{id}/download")
    public ResponseEntity<Void> download(@PathVariable Integer id) {
        String url = documentoService.obterUrlDocumento(id);
        return ResponseEntity.status(HttpStatus.FOUND)
                .location(URI.create(url))
                .build();
    }

    @Operation(summary = "Preview de documento", description = "Redireciona para a URL publica do documento no Supabase.")
    @ApiResponses({
            @ApiResponse(responseCode = "302", description = "Redirecionamento realizado com sucesso"),
            @ApiResponse(responseCode = "404", description = "Documento nao encontrado")
    })
    @GetMapping("/{id}/preview")
    public ResponseEntity<Void> preview(@PathVariable Integer id) {
        String url = documentoService.obterUrlDocumento(id);
        return ResponseEntity.status(HttpStatus.FOUND)
                .location(URI.create(url))
                .build();
    }

    @Operation(summary = "Listar documentos do usuario", description = "Retorna todos os documentos de um usuario.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Lista retornada com sucesso")
    })
    @GetMapping("/usuario/{usuarioId}")
    public ResponseEntity<List<DocumentoResponse>> listarDoUsuario(@PathVariable Integer usuarioId) {
        return ResponseEntity.ok(
                documentoService.listarPorUsuario(usuarioId)
                        .stream()
                        .map(DocumentoResponse::fromEntity)
                        .toList()
        );
    }

    @Operation(summary = "Remover documento", description = "Remove um documento do sistema.")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Documento removido com sucesso"),
            @ApiResponse(responseCode = "404", description = "Documento nao encontrado")
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        documentoService.remover(id);
        return ResponseEntity.noContent().build();
    }

    @ExceptionHandler({MaxUploadSizeExceededException.class, MultipartException.class})
    public ResponseEntity<String> handleUploadTooLarge(Exception ex) {
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE).body("Arquivo muito grande");
    }
}
