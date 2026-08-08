package com.example.tcc_backend.controller;

import com.example.tcc_backend.dto.request.AvaliacaoAcademicaRequest;
import com.example.tcc_backend.dto.request.AvaliacaoCienciaRequest;
import com.example.tcc_backend.dto.response.AvaliacaoAcademicaResponse;
import com.example.tcc_backend.service.AvaliacaoAcademicaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projetos/{id}/avaliacoes")
@RequiredArgsConstructor
@Tag(name = "Avaliacoes academicas", description = "Avaliacoes do orientador sobre estudantes por etapa concluida")
public class AvaliacaoController {

    private final AvaliacaoAcademicaService avaliacaoService;

    @Operation(summary = "Listar avaliacoes do projeto")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Avaliacoes retornadas com sucesso"),
            @ApiResponse(responseCode = "403", description = "Sem permissao para visualizar as avaliacoes"),
            @ApiResponse(responseCode = "404", description = "Projeto nao encontrado")
    })
    @GetMapping
    public ResponseEntity<List<AvaliacaoAcademicaResponse>> listar(@PathVariable Integer id) {
        return ResponseEntity.ok(avaliacaoService.listar(id));
    }

    @Operation(summary = "Criar avaliacao academica para etapa concluida")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Avaliacao criada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados invalidos ou etapa nao concluida"),
            @ApiResponse(responseCode = "403", description = "Apenas o orientador responsavel pode avaliar"),
            @ApiResponse(responseCode = "404", description = "Projeto, etapa ou aluno nao encontrados"),
            @ApiResponse(responseCode = "409", description = "Ja existe avaliacao para aluno, projeto e etapa")
    })
    @PostMapping
    public ResponseEntity<AvaliacaoAcademicaResponse> criar(@PathVariable Integer id,
                                                            @RequestBody @Valid AvaliacaoAcademicaRequest request) {
        return ResponseEntity.ok(avaliacaoService.criar(id, request));
    }

    @Operation(summary = "Editar avaliacao academica",
            description = "Permitido apenas enquanto o estudante nao registrar ciencia.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Avaliacao atualizada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados invalidos"),
            @ApiResponse(responseCode = "403", description = "Apenas o orientador responsavel pode editar"),
            @ApiResponse(responseCode = "404", description = "Avaliacao nao encontrada"),
            @ApiResponse(responseCode = "409", description = "Ciencia ja registrada pelo aluno")
    })
    @PatchMapping("/{avaliacaoId}")
    public ResponseEntity<AvaliacaoAcademicaResponse> atualizar(@PathVariable Integer id,
                                                                @PathVariable Long avaliacaoId,
                                                                @RequestBody @Valid AvaliacaoAcademicaRequest request) {
        return ResponseEntity.ok(avaliacaoService.atualizar(id, avaliacaoId, request));
    }

    @Operation(summary = "Obter avaliacao academica",
            description = "Privada entre orientador responsavel e estudante avaliado.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Avaliacao retornada com sucesso"),
            @ApiResponse(responseCode = "403", description = "Sem permissao para visualizar a avaliacao"),
            @ApiResponse(responseCode = "404", description = "Avaliacao nao encontrada")
    })
    @GetMapping("/{avaliacaoId}")
    public ResponseEntity<AvaliacaoAcademicaResponse> obter(@PathVariable Integer id,
                                                            @PathVariable Long avaliacaoId) {
        return ResponseEntity.ok(avaliacaoService.obter(id, avaliacaoId));
    }

    @Operation(summary = "Registrar ciencia da avaliacao pelo estudante",
            description = "Somente o estudante avaliado, uma unica vez, com comentario opcional.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Ciencia registrada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Comentario invalido"),
            @ApiResponse(responseCode = "403", description = "Somente o aluno avaliado pode registrar ciencia"),
            @ApiResponse(responseCode = "404", description = "Avaliacao nao encontrada"),
            @ApiResponse(responseCode = "409", description = "Ciencia ja registrada")
    })
    @PostMapping("/{avaliacaoId}/ciencia")
    public ResponseEntity<AvaliacaoAcademicaResponse> registrarCiencia(@PathVariable Integer id,
                                                                       @PathVariable Long avaliacaoId,
                                                                       @RequestBody(required = false) @Valid AvaliacaoCienciaRequest request) {
        return ResponseEntity.ok(avaliacaoService.registrarCiencia(id, avaliacaoId, request));
    }
}
