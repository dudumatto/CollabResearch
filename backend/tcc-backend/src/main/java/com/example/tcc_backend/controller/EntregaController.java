package com.example.tcc_backend.controller;

import com.example.tcc_backend.dto.request.DeliveryReviewRequest;
import com.example.tcc_backend.dto.request.EntregaRequest;
import com.example.tcc_backend.dto.response.DeliveryReviewResponse;
import com.example.tcc_backend.dto.response.DeliveryVersionResponse;
import com.example.tcc_backend.dto.response.EntregaResponse;
import com.example.tcc_backend.service.EntregaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
@RequestMapping("/api/projetos/{id}/entregas")
@RequiredArgsConstructor
@Tag(name = "Entregas", description = "Entregas de arquivos do projeto, versoes e revisoes do orientador")
public class EntregaController {

    private final EntregaService entregaService;

    @Operation(summary = "Listar entregas do projeto")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Entregas retornadas com sucesso"),
            @ApiResponse(responseCode = "403", description = "Sem permissao para acessar as entregas"),
            @ApiResponse(responseCode = "404", description = "Projeto nao encontrado")
    })
    @GetMapping
    public ResponseEntity<List<EntregaResponse>> listar(@PathVariable Integer id) {
        return ResponseEntity.ok(entregaService.listar(id));
    }

    @Operation(summary = "Criar entrega no projeto")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Entrega criada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados invalidos ou arquivo nao permitido"),
            @ApiResponse(responseCode = "403", description = "Usuario nao participa do projeto"),
            @ApiResponse(responseCode = "404", description = "Projeto ou etapa nao encontrados"),
            @ApiResponse(responseCode = "413", description = "Arquivo muito grande")
    })
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<EntregaResponse> criar(@PathVariable Integer id,
                                                 @RequestParam("titulo") String titulo,
                                                 @RequestParam("categoria") String categoria,
                                                 @RequestParam(value = "etapaId", required = false) String etapaId,
                                                 @RequestPart("arquivo") MultipartFile arquivo) {
        EntregaRequest request = new EntregaRequest();
        request.setTitulo(titulo);
        request.setCategoria(categoria);
        request.setEtapaId(etapaId == null || etapaId.isBlank() ? null : Integer.parseInt(etapaId));

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(entregaService.criar(id, request, arquivo));
    }

    @Operation(summary = "Reenviar entrega criando nova versao")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Nova versao criada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Arquivo nao permitido"),
            @ApiResponse(responseCode = "403", description = "Somente o autor pode reenviar"),
            @ApiResponse(responseCode = "404", description = "Entrega nao encontrada"),
            @ApiResponse(responseCode = "413", description = "Arquivo muito grande")
    })
    @PostMapping(value = "/{entregaId}/versoes", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<EntregaResponse> reenviar(@PathVariable Integer id,
                                                    @PathVariable Long entregaId,
                                                    @RequestPart("arquivo") MultipartFile arquivo) {
        return ResponseEntity.ok(entregaService.reenviar(id, entregaId, arquivo));
    }

    @Operation(summary = "Listar versoes de uma entrega")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Versoes retornadas com sucesso"),
            @ApiResponse(responseCode = "403", description = "Sem permissao para acessar as entregas"),
            @ApiResponse(responseCode = "404", description = "Entrega nao encontrada")
    })
    @GetMapping("/{entregaId}/versoes")
    public ResponseEntity<List<DeliveryVersionResponse>> listarVersoes(@PathVariable Integer id,
                                                                       @PathVariable Long entregaId) {
        return ResponseEntity.ok(entregaService.listarVersoes(id, entregaId));
    }

    @Operation(summary = "Revisar versao da entrega")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Revisao registrada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Decisao ou comentario obrigatorios"),
            @ApiResponse(responseCode = "403", description = "Apenas o orientador responsavel pode revisar"),
            @ApiResponse(responseCode = "404", description = "Entrega ou versao nao encontradas"),
            @ApiResponse(responseCode = "409", description = "Versao ja revisada ou nao e a mais recente")
    })
    @PostMapping("/{entregaId}/versoes/{versaoId}/revisao")
    public ResponseEntity<DeliveryReviewResponse> revisar(@PathVariable Integer id,
                                                          @PathVariable Long entregaId,
                                                          @PathVariable Long versaoId,
                                                          @RequestBody @Valid DeliveryReviewRequest request) {
        return ResponseEntity.ok(entregaService.revisar(id, entregaId, versaoId, request));
    }

    @Operation(summary = "Baixar arquivo da versao da entrega",
            description = "Redireciona para URL assinada temporaria ou serve o arquivo local apos validar autorizacao.")
    @ApiResponses({
            @ApiResponse(responseCode = "302", description = "Redirecionamento para URL assinada"),
            @ApiResponse(responseCode = "200", description = "Arquivo servido com sucesso"),
            @ApiResponse(responseCode = "403", description = "Sem permissao para acessar as entregas"),
            @ApiResponse(responseCode = "404", description = "Versao nao encontrada")
    })
    @GetMapping("/{entregaId}/versoes/{versaoId}/download")
    public ResponseEntity<Resource> download(@PathVariable Integer id,
                                             @PathVariable Long entregaId,
                                             @PathVariable Long versaoId) {
        EntregaService.DescargaEntrega descarga = entregaService.obterDescarga(id, entregaId, versaoId);

        if (descarga.isRemota()) {
            return ResponseEntity.status(HttpStatus.FOUND)
                    .location(URI.create(descarga.url()))
                    .build();
        }

        String nomeCodificado = new String(descarga.nomeArquivo().getBytes(StandardCharsets.UTF_8),
                StandardCharsets.ISO_8859_1);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + nomeCodificado + "\"")
                .contentType(descarga.contentType() != null
                        ? MediaType.parseMediaType(descarga.contentType())
                        : MediaType.APPLICATION_OCTET_STREAM)
                .body(new FileSystemResource(descarga.caminhoLocal()));
    }
}
