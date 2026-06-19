package com.example.tcc_backend.controller;

import com.example.tcc_backend.dto.request.AdvanceProgressStepRequest;
import com.example.tcc_backend.dto.request.CreateProjectProgressUpdateRequest;
import com.example.tcc_backend.dto.response.AdvanceProgressStepResponse;
import com.example.tcc_backend.dto.response.ProjectProgressResponse;
import com.example.tcc_backend.dto.response.ProjectProgressUpdateResponse;
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

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "Project Progress", description = "Endpoints estruturados de progresso por etapas")
public class ProjectProgressController {

    private final EtapaProgressoService etapaProgressoService;

    @Operation(summary = "Obter progresso estruturado do projeto")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Resumo retornado com sucesso"),
            @ApiResponse(responseCode = "403", description = "Usuario nao participa do projeto"),
            @ApiResponse(responseCode = "404", description = "Projeto nao encontrado")
    })
    @GetMapping({"/projects/{id}/progress", "/projetos/{id}/progress"})
    public ResponseEntity<ProjectProgressResponse> obterResumo(@PathVariable Integer id) {
        return ResponseEntity.ok(etapaProgressoService.obterResumo(id));
    }

    @Operation(summary = "Concluir etapa do projeto")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Etapa concluida com sucesso"),
            @ApiResponse(responseCode = "400", description = "Status invalido"),
            @ApiResponse(responseCode = "403", description = "Sem permissao para concluir a etapa"),
            @ApiResponse(responseCode = "404", description = "Etapa ou projeto nao encontrados")
    })
    @PatchMapping({"/projects/{id}/steps/{stepId}", "/projetos/{id}/steps/{stepId}"})
    public ResponseEntity<AdvanceProgressStepResponse> concluirEtapa(
            @PathVariable Integer id,
            @PathVariable Integer stepId,
            @RequestBody @Valid AdvanceProgressStepRequest request) {
        return ResponseEntity.ok(etapaProgressoService.avancarEtapa(id, stepId, request));
    }

    @Operation(summary = "Publicar atualizacao do projeto")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Atualizacao criada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados invalidos"),
            @ApiResponse(responseCode = "403", description = "Usuario nao participa do projeto"),
            @ApiResponse(responseCode = "404", description = "Projeto ou etapa nao encontrados")
    })
    @PostMapping({"/projects/{id}/updates", "/projetos/{id}/updates"})
    public ResponseEntity<ProjectProgressUpdateResponse> criarAtualizacao(
            @PathVariable Integer id,
            @RequestBody @Valid CreateProjectProgressUpdateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(etapaProgressoService.criarAtualizacao(id, request));
    }
}
