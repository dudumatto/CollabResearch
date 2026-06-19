package com.example.tcc_backend.controller;

import com.example.tcc_backend.dto.response.IdNomeResponse;
import com.example.tcc_backend.service.CursoCatalogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/cursos")
@Tag(name = "Catalogos", description = "Endpoints de catalogos (areas, cursos, etc.)")
public class CursoController {

    private final CursoCatalogService service;

    public CursoController(CursoCatalogService service) {
        this.service = service;
    }

    @Operation(summary = "Listar cursos")
    @GetMapping
    public ResponseEntity<List<IdNomeResponse>> list() {
        return ResponseEntity.ok(service.list());
    }
}

