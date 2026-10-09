package com.example.tcc_backend.controller;

import com.example.tcc_backend.dto.request.LumenRankingRequest;
import com.example.tcc_backend.dto.response.LumenRankingResponse;
import com.example.tcc_backend.model.Usuario;
import com.example.tcc_backend.security.AuthHelper;
import com.example.tcc_backend.service.LumenService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/lumen")
@RequiredArgsConstructor
@Tag(name = "Lumen AI", description = "Analise assistida por IA das inscricoes de um projeto")
public class LumenController {

    private final LumenService lumenService;
    private final AuthHelper authHelper;

    @Operation(summary = "Ranquear inscricoes pendentes",
            description = "Usa IA para sugerir um ranking de compatibilidade das inscricoes pendentes de um projeto. Apenas o orientador responsavel (ou admin) pode executar.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Ranking gerado com sucesso"),
            @ApiResponse(responseCode = "403", description = "Acesso negado"),
            @ApiResponse(responseCode = "404", description = "Projeto nao encontrado"),
            @ApiResponse(responseCode = "503", description = "Lumen AI indisponivel ou nao configurada")
    })
    @PostMapping("/ranquear/{projetoId}")
    public ResponseEntity<LumenRankingResponse> ranquear(@PathVariable Integer projetoId,
                                                         @RequestBody(required = false) LumenRankingRequest request) {
        Usuario usuario = authHelper.getCurrentUser();
        return ResponseEntity.ok(lumenService.ranquear(projetoId, usuario, request == null ? null : request.inscricaoIds()));
    }
}
