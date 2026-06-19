package com.example.tcc_backend.controller;

import com.example.tcc_backend.dto.request.AdminAreaRequest;
import com.example.tcc_backend.dto.request.AdminConfiguracaoRequest;
import com.example.tcc_backend.dto.response.AdminAreaResponse;
import com.example.tcc_backend.dto.response.ConfiguracaoResponse;
import com.example.tcc_backend.service.AdminCatalogService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminCatalogController {

    private final AdminCatalogService service;

    @GetMapping("/areas")
    public ResponseEntity<List<AdminAreaResponse>> areas() {
        return ResponseEntity.ok(service.listAreas());
    }

    @PostMapping("/areas")
    public ResponseEntity<AdminAreaResponse> createArea(@RequestBody @Valid AdminAreaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.createArea(request));
    }

    @PutMapping("/areas/{id}")
    public ResponseEntity<AdminAreaResponse> updateArea(
            @PathVariable Integer id,
            @RequestBody @Valid AdminAreaRequest request) {
        return ResponseEntity.ok(service.updateArea(id, request));
    }

    @DeleteMapping("/areas/{id}")
    public ResponseEntity<Void> deleteArea(@PathVariable Integer id) {
        service.deleteArea(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/configuracoes")
    public ResponseEntity<List<ConfiguracaoResponse>> settings() {
        return ResponseEntity.ok(service.listSettings());
    }

    @PutMapping("/configuracoes/{key}")
    public ResponseEntity<ConfiguracaoResponse> updateSetting(
            @PathVariable String key,
            @RequestBody @Valid AdminConfiguracaoRequest request) {
        return ResponseEntity.ok(service.updateSetting(key, request));
    }
}
