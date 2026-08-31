package com.example.tcc_backend.controller;

import com.example.tcc_backend.dto.request.OrientadorPerfilRequest;
import com.example.tcc_backend.dto.response.EntregaResponse;
import com.example.tcc_backend.dto.response.InscricaoResponse;
import com.example.tcc_backend.dto.response.OrientadorDashboardResponse;
import com.example.tcc_backend.dto.response.OrientadorPerfilResponse;
import com.example.tcc_backend.dto.response.OrientandoDetalheResponse;
import com.example.tcc_backend.dto.response.OrientandoResponse;
import com.example.tcc_backend.service.OrientadorService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;

import java.util.List;

@RestController
@RequestMapping({"/api/orientador", "/api/orientadores"})
@RequiredArgsConstructor
@Tag(name = "Orientador", description = "Endpoints da area do professor/orientador")
public class OrientadorController {

    private final OrientadorService orientadorService;

    @Operation(summary = "Dashboard do orientador",
            description = "Retorna metricas e filas resumidas da area do orientador, limitadas aos cinco itens mais relevantes.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Dashboard retornado com sucesso"),
            @ApiResponse(responseCode = "401", description = "Nao autenticado"),
            @ApiResponse(responseCode = "403", description = "Acesso restrito ao orientador")
    })
    @GetMapping("/dashboard")
    public ResponseEntity<OrientadorDashboardResponse> dashboard() {
        return ResponseEntity.ok(orientadorService.dashboard());
    }

    @Operation(summary = "Entregas recebidas",
            description = "Retorna todas as entregas dos projetos sob orientacao, com filtros opcionais por status e projeto.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Entregas retornadas com sucesso"),
            @ApiResponse(responseCode = "400", description = "Status invalido"),
            @ApiResponse(responseCode = "401", description = "Nao autenticado"),
            @ApiResponse(responseCode = "403", description = "Acesso restrito ao orientador")
    })
    @GetMapping("/entregas")
    public ResponseEntity<List<EntregaResponse>> entregas(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Integer projetoId) {
        return ResponseEntity.ok(orientadorService.entregas(status, projetoId));
    }

    @Operation(summary = "Inscricoes recebidas",
            description = "Retorna as inscricoes recebidas nos projetos do orientador, com filtros opcionais por status e projeto.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Inscricoes retornadas com sucesso"),
            @ApiResponse(responseCode = "400", description = "Status invalido"),
            @ApiResponse(responseCode = "401", description = "Nao autenticado"),
            @ApiResponse(responseCode = "403", description = "Acesso restrito ao orientador")
    })
    @GetMapping("/inscricoes")
    public ResponseEntity<List<InscricaoResponse>> inscricoes(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Integer projetoId) {
        return ResponseEntity.ok(orientadorService.inscricoes(status, projetoId));
    }

    @Operation(summary = "Orientandos",
            description = "Retorna os estudantes orientados, deduplicados por projeto, com busca, situacao, projetos, progresso e pendencias.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Orientandos retornados com sucesso"),
            @ApiResponse(responseCode = "401", description = "Nao autenticado"),
            @ApiResponse(responseCode = "403", description = "Acesso restrito ao orientador")
    })
    @GetMapping("/orientandos")
    public ResponseEntity<List<OrientandoResponse>> orientandos(
            @RequestParam(required = false) String busca,
            @RequestParam(required = false) String situacao,
            @RequestParam(required = false) Integer projetoId) {
        return ResponseEntity.ok(orientadorService.orientandos(busca, situacao, projetoId));
    }

    @Operation(summary = "Detalhe do orientando",
            description = "Retorna o detalhe de um orientando com projeto selecionado, etapas, prazos e historico de participacao.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Detalhe retornado com sucesso"),
            @ApiResponse(responseCode = "401", description = "Nao autenticado"),
            @ApiResponse(responseCode = "403", description = "Acesso restrito ao orientador ou aluno fora do escopo"),
            @ApiResponse(responseCode = "404", description = "Aluno nao encontrado ou nao orientando")
    })
    @GetMapping("/orientandos/{studentId}")
    public ResponseEntity<OrientandoDetalheResponse> detalheOrientando(
            @PathVariable Integer studentId,
            @RequestParam(required = false) Integer projectId) {
        return ResponseEntity.ok(orientadorService.detalheOrientando(studentId, projectId));
    }

    @Operation(summary = "Perfil do orientador",
            description = "Retorna o perfil do orientador autenticado com quantidade de projetos, orientandos e avaliacoes.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Perfil retornado com sucesso"),
            @ApiResponse(responseCode = "401", description = "Nao autenticado"),
            @ApiResponse(responseCode = "403", description = "Acesso restrito ao orientador")
    })
    @GetMapping("/perfil")
    public ResponseEntity<OrientadorPerfilResponse> perfil() {
        return ResponseEntity.ok(orientadorService.perfil());
    }

    @Operation(summary = "Atualizar perfil do orientador",
            description = "Atualiza nome, email, instituicao, biografia, foto, departamento e titulacao do orientador autenticado.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Perfil atualizado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados invalidos"),
            @ApiResponse(responseCode = "401", description = "Nao autenticado"),
            @ApiResponse(responseCode = "403", description = "Acesso restrito ao orientador"),
            @ApiResponse(responseCode = "409", description = "Email ja em uso por outro usuario")
    })
    @PatchMapping("/perfil")
    public ResponseEntity<OrientadorPerfilResponse> atualizarPerfil(
            @RequestBody @Valid OrientadorPerfilRequest request) {
        return ResponseEntity.ok(orientadorService.atualizarPerfil(request));
    }
}
