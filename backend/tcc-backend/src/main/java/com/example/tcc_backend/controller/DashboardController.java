package com.example.tcc_backend.controller;

import com.example.tcc_backend.dto.response.DashboardResponse;
import com.example.tcc_backend.service.DashboardService;

import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@Tag(name = "Dashboard", description = "Endpoints de resumo e métricas do sistema")
public class DashboardController {

    private final DashboardService dashboardService;

    @Operation(
            summary = "Resumo do dashboard",
            description = "Retorna métricas gerais e dados consolidados do sistema."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Dados retornados com sucesso"),
            @ApiResponse(responseCode = "401", description = "Usuário não autenticado")
    })
    @GetMapping({"", "/stats", "/activity"})
    public ResponseEntity<DashboardResponse> resumo() {
        return ResponseEntity.ok(dashboardService.getDashboard());
    }
}
