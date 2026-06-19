package com.example.tcc_backend.controller;

import com.example.tcc_backend.dto.request.InscricaoAvaliacaoRequest;
import com.example.tcc_backend.dto.request.InscricaoRequest;
import com.example.tcc_backend.dto.response.InscricaoResponse;
import com.example.tcc_backend.dto.response.PageResponse;
import com.example.tcc_backend.service.InscricaoService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

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
@RequestMapping({"/api/inscricoes", "/api/subscriptions"})
@RequiredArgsConstructor
@Tag(name = "Inscrições", description = "Endpoints relacionados às inscrições em projetos")
public class InscricaoController {

    private final InscricaoService inscricaoService;

    @Operation(summary = "Listar inscrições", description = "Retorna todas as inscrições do sistema.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Lista retornada com sucesso")
    })
    @GetMapping
    public ResponseEntity<List<InscricaoResponse>> findAll() {
        return ResponseEntity.ok(
                inscricaoService.findAll().stream().map(InscricaoResponse::fromEntity).toList()
        );
    }

    @Operation(summary = "Listar inscrições paginadas", description = "Retorna inscrições com paginação.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Lista paginada retornada com sucesso")
    })
    @GetMapping({"/pagina", "/page"})
    public ResponseEntity<PageResponse<InscricaoResponse>> findAllPaginado(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "dataInscricao") String sort,
            @RequestParam(defaultValue = "DESC") String direction) {
        return ResponseEntity.ok(
                PageResponse.from(
                        inscricaoService.findAll(
                                PageRequest.of(page, size, Sort.by(Sort.Direction.fromString(direction), sort))
                        ).map(InscricaoResponse::fromEntity)
                )
        );
    }

    @Operation(summary = "Buscar inscrição por ID", description = "Retorna uma inscrição específica.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Inscrição encontrada"),
            @ApiResponse(responseCode = "404", description = "Inscrição não encontrada")
    })
    @GetMapping("/{id}")
    public ResponseEntity<InscricaoResponse> findById(@PathVariable Integer id) {
        return ResponseEntity.ok(
                InscricaoResponse.fromEntity(inscricaoService.findById(id))
        );
    }

    @Operation(summary = "Listar inscrições por projeto", description = "Retorna inscrições de um projeto específico.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Lista retornada com sucesso")
    })
    @GetMapping({"/projeto/{projetoId}", "/project/{projetoId}"})
    public ResponseEntity<List<InscricaoResponse>> findByProjeto(@PathVariable Integer projetoId) {
        return ResponseEntity.ok(
                inscricaoService.findByProjeto(projetoId).stream()
                        .map(InscricaoResponse::fromEntity).toList()
        );
    }

    @Operation(summary = "Listar inscrições por projeto paginadas", description = "Retorna inscrições paginadas de um projeto.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Lista paginada retornada com sucesso")
    })
    @GetMapping({"/projeto/{projetoId}/pagina", "/project/{projetoId}/page"})
    public ResponseEntity<PageResponse<InscricaoResponse>> findByProjetoPaginado(
            @PathVariable Integer projetoId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "dataInscricao") String sort,
            @RequestParam(defaultValue = "DESC") String direction) {
        return ResponseEntity.ok(
                PageResponse.from(
                        inscricaoService.findByProjeto(
                                projetoId,
                                PageRequest.of(page, size, Sort.by(Sort.Direction.fromString(direction), sort))
                        ).map(InscricaoResponse::fromEntity)
                )
        );
    }

    @Operation(summary = "Criar inscrição", description = "Cria uma nova inscrição em um projeto.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Inscrição criada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados inválidos")
    })
    @PostMapping
    public ResponseEntity<InscricaoResponse> create(@RequestBody @Valid InscricaoRequest dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(InscricaoResponse.fromEntity(inscricaoService.create(dto)));
    }

    @Operation(summary = "Aprovar inscrição", description = "Aprova uma inscrição.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Inscrição aprovada com sucesso"),
            @ApiResponse(responseCode = "404", description = "Inscrição não encontrada")
    })
    @PutMapping({"/{id}/aprovar", "/{id}/approve"})
    public ResponseEntity<InscricaoResponse> aprovar(@PathVariable Integer id,
                                                     @RequestBody(required = false) @Valid InscricaoAvaliacaoRequest dto) {
        return ResponseEntity.ok(
                InscricaoResponse.fromEntity(inscricaoService.aprovar(id, dto))
        );
    }

    @Operation(summary = "Rejeitar inscrição", description = "Rejeita uma inscrição.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Inscrição rejeitada com sucesso"),
            @ApiResponse(responseCode = "404", description = "Inscrição não encontrada")
    })
    @PutMapping({"/{id}/rejeitar", "/{id}/reject"})
    public ResponseEntity<InscricaoResponse> rejeitar(@PathVariable Integer id,
                                                      @RequestBody(required = false) @Valid InscricaoAvaliacaoRequest dto) {
        return ResponseEntity.ok(
                InscricaoResponse.fromEntity(inscricaoService.rejeitar(id, dto))
        );
    }

    @Operation(summary = "Cancelar inscrição (admin)", description = "Remove uma inscrição do sistema.")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Inscrição removida com sucesso")
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> cancel(@PathVariable Integer id) {
        inscricaoService.cancel(id);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Cancelar minha inscrição", description = "Permite ao usuário cancelar sua própria inscrição.")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Inscrição cancelada com sucesso")
    })
    @DeleteMapping({"/{id}/cancelar", "/{id}/cancel"})
    public ResponseEntity<Void> cancelarMinha(@PathVariable Integer id) {
        inscricaoService.cancelarMinha(id);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Atualizar inscrição", description = "Atualiza dados de uma inscrição.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Inscrição atualizada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados inválidos")
    })
    @PutMapping("/{id}")
    public ResponseEntity<InscricaoResponse> update(@PathVariable Integer id,
                                                    @RequestBody @Valid InscricaoRequest dto) {
        return ResponseEntity.ok(
                InscricaoResponse.fromEntity(inscricaoService.update(id, dto))
        );
    }
}
