package com.example.tcc_backend.controller;

import com.example.tcc_backend.dto.response.IdNomeResponse;
import com.example.tcc_backend.service.AreaPesquisaCatalogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/areas")
@Tag(name = "Catalogos", description = "Endpoints de catalogos (areas, cursos, etc.)")
public class AreaPesquisaController {

    private final AreaPesquisaCatalogService service;

    public AreaPesquisaController(AreaPesquisaCatalogService service) {
        this.service = service;
    }

    @Operation(summary = "Listar areas de pesquisa")
    @GetMapping
    public ResponseEntity<List<IdNomeResponse>> list() {
        return ResponseEntity.ok(service.list());
    }
}

