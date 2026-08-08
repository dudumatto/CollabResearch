package com.example.tcc_backend.controller;

import com.example.tcc_backend.dto.request.AdvanceProgressStepRequest;
import com.example.tcc_backend.dto.request.EtapaRequest;
import com.example.tcc_backend.dto.response.EtapaResponse;
import com.example.tcc_backend.service.EtapaProgressoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.util.List;

@RestController
@RequestMapping("/api/projetos/{id}/etapas")
@RequiredArgsConstructor
@Tag(name = "Etapas", description = "CRUD de etapas de projeto e conclusao por responsavel")
public class EtapaController {

    private final EtapaProgressoService etapaProgressoService;

    @Operation(summary = "Listar etapas do projeto")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Etapas retornadas com sucesso"),
            @ApiResponse(responseCode = "403", description = "Usuario nao participa do projeto"),
            @ApiResponse(responseCode = "404", description = "Projeto nao encontrado")
    })
    @GetMapping
    public ResponseEntity<List<EtapaResponse>> listar(@PathVariable Integer id) {
        return ResponseEntity.ok(etapaProgressoService.listarEtapas(id));
    }

    @Operation(summary = "Criar etapa no projeto")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Etapa criada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados invalidos"),
            @ApiResponse(responseCode = "403", description = "Apenas o orientador responsavel pode executar esta acao"),
            @ApiResponse(responseCode = "404", description = "Projeto nao encontrado")
    })
    @PostMapping
    public ResponseEntity<EtapaResponse> criar(@PathVariable Integer id,
                                               @RequestBody @Valid EtapaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(etapaProgressoService.criarEtapa(id, request));
    }

    @Operation(summary = "Atualizar etapa do projeto")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Etapa atualizada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados invalidos"),
            @ApiResponse(responseCode = "403", description = "Apenas o orientador responsavel pode executar esta acao"),
            @ApiResponse(responseCode = "404", description = "Etapa ou projeto nao encontrados"),
            @ApiResponse(responseCode = "409", description = "Etapa concluida nao pode ser alterada")
    })
    @PutMapping("/{etapaId}")
    public ResponseEntity<EtapaResponse> atualizar(@PathVariable Integer id,
                                                   @PathVariable Integer etapaId,
                                                   @RequestBody @Valid EtapaRequest request) {
        return ResponseEntity.ok(etapaProgressoService.atualizarEtapa(id, etapaId, request));
    }

    @Operation(summary = "Excluir etapa do projeto")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Etapa excluida com sucesso"),
            @ApiResponse(responseCode = "403", description = "Apenas o orientador responsavel pode executar esta acao"),
            @ApiResponse(responseCode = "404", description = "Etapa ou projeto nao encontrados"),
            @ApiResponse(responseCode = "409", description = "Etapa concluida nao pode ser removida")
    })
    @DeleteMapping("/{etapaId}")
    public ResponseEntity<Void> excluir(@PathVariable Integer id, @PathVariable Integer etapaId) {
        etapaProgressoService.excluirEtapa(id, etapaId);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Concluir etapa do projeto")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Etapa concluida com sucesso"),
            @ApiResponse(responseCode = "400", description = "Status invalido"),
            @ApiResponse(responseCode = "403", description = "Sem permissao para concluir a etapa"),
            @ApiResponse(responseCode = "404", description = "Etapa ou projeto nao encontrados")
    })
    @PatchMapping("/{etapaId}")
    public ResponseEntity<EtapaResponse> concluir(@PathVariable Integer id,
                                                  @PathVariable Integer etapaId,
                                                  @RequestBody @Valid AdvanceProgressStepRequest request) {
        return ResponseEntity.ok(etapaProgressoService.concluirEtapa(id, etapaId, request));
    }
}
