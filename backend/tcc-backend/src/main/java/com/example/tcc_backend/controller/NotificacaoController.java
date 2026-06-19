package com.example.tcc_backend.controller;

import com.example.tcc_backend.dto.response.NotificacaoResponse;
import com.example.tcc_backend.dto.response.PageResponse;
import com.example.tcc_backend.service.NotificacaoService;

import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;

import java.util.List;

@RestController
@RequestMapping({"/api/notificacoes", "/api/notifications"})
@RequiredArgsConstructor
@Tag(name = "Notificações", description = "Endpoints relacionados às notificações do usuário")
public class NotificacaoController {

    private final NotificacaoService notificacaoService;

    @Operation(
            summary = "Listar notificações",
            description = "Retorna todas as notificações do usuário autenticado."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Notificações retornadas com sucesso"),
            @ApiResponse(responseCode = "401", description = "Usuário não autenticado")
    })
    @GetMapping
    public ResponseEntity<List<NotificacaoResponse>> listarMinhas() {
        return ResponseEntity.ok(
                notificacaoService.minhasNotificacoes()
                        .stream().map(NotificacaoResponse::fromEntity).toList()
        );
    }

    @Operation(
            summary = "Listar notificações paginadas",
            description = "Retorna notificações do usuário com paginação e ordenação."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Lista paginada retornada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Parâmetros inválidos")
    })
    @GetMapping("/pagina")
    public ResponseEntity<PageResponse<NotificacaoResponse>> listarMinhasPaginadas(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "dataCriacao") String sort,
            @RequestParam(defaultValue = "DESC") String direction) {
        return ResponseEntity.ok(
                PageResponse.from(
                        notificacaoService.minhasNotificacoes(
                                PageRequest.of(page, size, Sort.by(Sort.Direction.fromString(direction), sort))
                        ).map(NotificacaoResponse::fromEntity)
                )
        );
    }

    @Operation(
            summary = "Marcar notificação como lida",
            description = "Marca uma notificação específica como lida."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Notificação atualizada com sucesso"),
            @ApiResponse(responseCode = "404", description = "Notificação não encontrada")
    })
    @PutMapping({"/{id}/ler", "/{id}/read"})
    public ResponseEntity<NotificacaoResponse> marcarComoLida(@PathVariable Integer id) {
        return ResponseEntity.ok(
                NotificacaoResponse.fromEntity(notificacaoService.marcarComoLida(id))
        );
    }

    @Operation(
            summary = "Marcar todas como lidas",
            description = "Marca todas as notificações do usuário como lidas."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Notificações atualizadas com sucesso"),
            @ApiResponse(responseCode = "401", description = "Usuário não autenticado")
    })
    @PutMapping({"/ler-todas", "/read-all"})
    public ResponseEntity<Void> marcarTodasComoLidas() {
        notificacaoService.marcarTodasComoLidas();
        return ResponseEntity.noContent().build();
    }
}
