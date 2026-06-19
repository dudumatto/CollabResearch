package com.example.tcc_backend.controller;

import com.example.tcc_backend.dto.request.*;
import com.example.tcc_backend.dto.response.*;
import com.example.tcc_backend.model.StatusDocumento;
import com.example.tcc_backend.model.StatusInscricao;
import com.example.tcc_backend.model.StatusProjeto;
import com.example.tcc_backend.service.AdminContentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminContentController {

    private final AdminContentService service;

    @GetMapping("/projetos")
    public ResponseEntity<PageResponse<ProjetoResponse>> projetos(
            @RequestParam(required = false) StatusProjeto status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(service.listProjetos(status, page, size));
    }

    @PostMapping("/projetos")
    public ResponseEntity<ProjetoResponse> createProjeto(@RequestBody @Valid ProjetoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.createProjeto(request));
    }

    @PutMapping("/projetos/{id}")
    public ResponseEntity<ProjetoResponse> updateProjeto(
            @PathVariable Integer id,
            @RequestBody @Valid ProjetoRequest request) {
        return ResponseEntity.ok(service.updateProjeto(id, request));
    }

    @PatchMapping("/projetos/{id}/status")
    public ResponseEntity<ProjetoResponse> setProjetoStatus(
            @PathVariable Integer id,
            @RequestBody @Valid AdminProjetoStatusRequest request) {
        return ResponseEntity.ok(service.setProjetoStatus(id, request));
    }

    @DeleteMapping("/projetos/{id}")
    public ResponseEntity<Void> deleteProjeto(@PathVariable Integer id) {
        service.deleteProjeto(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/inscricoes")
    public ResponseEntity<PageResponse<InscricaoResponse>> inscricoes(
            @RequestParam(required = false) StatusInscricao status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(service.listInscricoes(status, page, size));
    }

    @PatchMapping("/inscricoes/{id}/status")
    public ResponseEntity<InscricaoResponse> setInscricaoStatus(
            @PathVariable Integer id,
            @RequestBody @Valid AdminInscricaoStatusRequest request) {
        return ResponseEntity.ok(service.setInscricaoStatus(id, request));
    }

    @DeleteMapping("/inscricoes/{id}")
    public ResponseEntity<Void> deleteInscricao(@PathVariable Integer id) {
        service.deleteInscricao(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/documentos")
    public ResponseEntity<PageResponse<DocumentoResponse>> documentos(
            @RequestParam(required = false) StatusDocumento status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(service.listDocumentos(status, page, size));
    }

    @PatchMapping("/documentos/{id}/status")
    public ResponseEntity<DocumentoResponse> setDocumentoStatus(
            @PathVariable Integer id,
            @RequestBody @Valid AdminDocumentoStatusRequest request) {
        return ResponseEntity.ok(service.setDocumentoStatus(id, request));
    }

    @DeleteMapping("/documentos/{id}")
    public ResponseEntity<Void> deleteDocumento(@PathVariable Integer id) {
        service.deleteDocumento(id);
        return ResponseEntity.noContent().build();
    }
}
