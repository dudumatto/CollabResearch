package com.example.tcc_backend.controller;

import com.example.tcc_backend.dto.response.DeadlineNotificationResult;
import com.example.tcc_backend.service.DeadlineNotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/internal/jobs")
@RequiredArgsConstructor
@Tag(name = "Internal Jobs", description = "Endpoints internos executados por cron, protegidos por header X-Cron-Secret")
public class InternalJobController {

    private final DeadlineNotificationService deadlineNotificationService;

    @Operation(summary = "Disparar processamento de alertas de prazo",
            description = "Executa o job de alertas de prazo (7, 3 e 1 dia antes e atraso). Requer o header X-Cron-Secret.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Job executado com sucesso"),
            @ApiResponse(responseCode = "401", description = "X-Cron-Secret ausente ou invalido")
    })
    @PostMapping("/deadline-notifications")
    public ResponseEntity<DeadlineNotificationResult> processarAlertasDePrazo() {
        return ResponseEntity.ok(deadlineNotificationService.processarAlertasDePrazo());
    }
}
