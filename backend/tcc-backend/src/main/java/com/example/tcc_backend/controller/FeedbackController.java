package com.example.tcc_backend.controller;

import com.example.tcc_backend.dto.request.FeedbackRequest;
import com.example.tcc_backend.dto.response.FeedbackResponse;
import com.example.tcc_backend.dto.response.PageResponse;
import com.example.tcc_backend.service.FeedbackService;

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
@RequestMapping("/api/feedback")
@RequiredArgsConstructor
@Tag(name = "Feedback", description = "Endpoints relacionados aos feedbacks de projetos e usuários")
public class FeedbackController {

    private final FeedbackService feedbackService;

    @Operation(summary = "Criar feedback", description = "Cria um novo feedback.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Feedback criado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados inválidos")
    })
    @PostMapping
    public ResponseEntity<FeedbackResponse> criar(@RequestBody @Valid FeedbackRequest dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(FeedbackResponse.fromEntity(feedbackService.criar(dto)));
    }

    @Operation(summary = "Listar feedbacks por projeto", description = "Retorna todos os feedbacks de um projeto.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Lista retornada com sucesso"),
            @ApiResponse(responseCode = "404", description = "Projeto não encontrado")
    })
    @GetMapping("/projeto/{id}")
    public ResponseEntity<List<FeedbackResponse>> listarPorProjeto(@PathVariable Integer id) {
        return ResponseEntity.ok(
                feedbackService.listarPorProjeto(id).stream()
                        .map(FeedbackResponse::fromEntity)
                        .toList()
        );
    }

    @Operation(summary = "Listar feedbacks por projeto paginados", description = "Retorna feedbacks paginados de um projeto.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Lista paginada retornada com sucesso")
    })
    @GetMapping("/projeto/{id}/pagina")
    public ResponseEntity<PageResponse<FeedbackResponse>> listarPorProjetoPaginado(
            @PathVariable Integer id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "dataFeedback") String sort,
            @RequestParam(defaultValue = "DESC") String direction) {

        return ResponseEntity.ok(
                PageResponse.from(
                        feedbackService.listarPorProjeto(
                                id,
                                PageRequest.of(page, size, Sort.by(Sort.Direction.fromString(direction), sort))
                        ).map(FeedbackResponse::fromEntity)
                )
        );
    }

    @Operation(summary = "Listar feedbacks por usuário", description = "Retorna feedbacks associados a um usuário.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Lista retornada com sucesso")
    })
    @GetMapping("/usuario/{id}")
    public ResponseEntity<List<FeedbackResponse>> listarPorUsuario(@PathVariable Integer id) {
        return ResponseEntity.ok(
                feedbackService.listarPorUsuario(id).stream()
                        .map(FeedbackResponse::fromEntity)
                        .toList()
        );
    }

    @Operation(summary = "Listar feedbacks por usuário paginados", description = "Retorna feedbacks paginados de um usuário.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Lista paginada retornada com sucesso")
    })
    @GetMapping("/usuario/{id}/pagina")
    public ResponseEntity<PageResponse<FeedbackResponse>> listarPorUsuarioPaginado(
            @PathVariable Integer id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "dataFeedback") String sort,
            @RequestParam(defaultValue = "DESC") String direction) {

        return ResponseEntity.ok(
                PageResponse.from(
                        feedbackService.listarPorUsuario(
                                id,
                                PageRequest.of(page, size, Sort.by(Sort.Direction.fromString(direction), sort))
                        ).map(FeedbackResponse::fromEntity)
                )
        );
    }
}