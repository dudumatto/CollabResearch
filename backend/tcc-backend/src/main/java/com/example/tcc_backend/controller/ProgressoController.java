package com.example.tcc_backend.controller;

import com.example.tcc_backend.dto.request.ProgressoRequest;
import com.example.tcc_backend.dto.response.PageResponse;
import com.example.tcc_backend.dto.response.ProgressoResponse;
import com.example.tcc_backend.service.ProgressoService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "Progresso", description = "Endpoints relacionados ao acompanhamento de progresso dos projetos")
public class ProgressoController {

    private final ProgressoService progressoService;

    @Operation(
            summary = "Criar registro de progresso",
            description = "Cria um novo registro de progresso para um projeto específico."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Progresso criado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados inválidos"),
            @ApiResponse(responseCode = "404", description = "Projeto não encontrado")
    })
    @PostMapping("/projetos/{id}/progresso")
    public ResponseEntity<ProgressoResponse> criar(@PathVariable Integer id,
                                                   @RequestBody @Valid ProgressoRequest dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ProgressoResponse.fromEntity(progressoService.criar(id, dto)));
    }

    @Operation(
            summary = "Listar progresso do projeto",
            description = "Retorna todos os registros de progresso associados a um projeto."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Progresso retornado com sucesso"),
            @ApiResponse(responseCode = "404", description = "Projeto não encontrado")
    })
    @GetMapping("/projetos/{id}/progresso")
    public ResponseEntity<List<ProgressoResponse>> listarPorProjeto(@PathVariable Integer id) {
        return ResponseEntity.ok(
                progressoService.listarPorProjeto(id).stream()
                        .map(ProgressoResponse::fromEntity)
                        .toList()
        );
    }

    @Operation(
            summary = "Listar progresso paginado",
            description = "Retorna registros de progresso de um projeto com paginação manual."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Lista paginada retornada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Parâmetros inválidos"),
            @ApiResponse(responseCode = "404", description = "Projeto não encontrado")
    })
    @GetMapping("/projetos/{id}/progresso/pagina")
    public ResponseEntity<PageResponse<ProgressoResponse>> listarPorProjetoPaginado(
            @PathVariable Integer id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        List<ProgressoResponse> content = progressoService.listarPorProjeto(id).stream()
                .map(ProgressoResponse::fromEntity)
                .toList();

        int start = Math.min(page * size, content.size());
        int end = Math.min(start + size, content.size());

        return ResponseEntity.ok(
                PageResponse.from(
                        new PageImpl<>(
                                content.subList(start, end),
                                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "dataRegistro")),
                                content.size()
                        )
                )
        );
    }

    @Operation(
            summary = "Atualizar progresso",
            description = "Atualiza um registro de progresso existente."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Progresso atualizado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados inválidos"),
            @ApiResponse(responseCode = "404", description = "Progresso não encontrado")
    })
    @PutMapping("/progresso/{id}")
    public ResponseEntity<ProgressoResponse> atualizar(@PathVariable Integer id,
                                                       @RequestBody @Valid ProgressoRequest dto) {
        return ResponseEntity.ok(
                ProgressoResponse.fromEntity(progressoService.atualizar(id, dto))
        );
    }

    @Operation(
            summary = "Remover progresso",
            description = "Remove um registro de progresso do sistema."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Progresso removido com sucesso"),
            @ApiResponse(responseCode = "404", description = "Progresso não encontrado")
    })
    @DeleteMapping("/progresso/{id}")
    public ResponseEntity<Void> remover(@PathVariable Integer id) {
        progressoService.remover(id);
        return ResponseEntity.noContent().build();
    }
}