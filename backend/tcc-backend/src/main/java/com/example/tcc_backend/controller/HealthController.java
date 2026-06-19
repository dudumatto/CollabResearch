package com.example.tcc_backend.controller;

import com.example.tcc_backend.service.SupabaseStorageHealthService;
import com.example.tcc_backend.service.SupabaseStorageHealthService.SupabaseStorageHealth;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/health")
public class HealthController {

    private final SupabaseStorageHealthService supabaseStorageHealthService;

    public HealthController(SupabaseStorageHealthService supabaseStorageHealthService) {
        this.supabaseStorageHealthService = supabaseStorageHealthService;
    }

    @Operation(summary = "Verificar disponibilidade do servico")
    @ApiResponse(responseCode = "200", description = "Servico disponivel")
    @GetMapping
    public ResponseEntity<Void> ping() {
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "Verificar disponibilidade do Supabase Storage")
    @ApiResponse(responseCode = "200", description = "Supabase Storage acessivel")
    @ApiResponse(responseCode = "503", description = "Supabase Storage indisponivel ou nao configurado")
    @GetMapping("/supabase-storage")
    public ResponseEntity<Map<String, Object>> pingSupabaseStorage() {
        SupabaseStorageHealth health = supabaseStorageHealthService.check();
        return ResponseEntity.status(health.ok() ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE)
                .body(health.toResponseBody());
    }
}
