package com.example.tcc_backend.controller;

import com.example.tcc_backend.dto.request.AdminAtivoRequest;
import com.example.tcc_backend.dto.request.AdminUsuarioRequest;
import com.example.tcc_backend.dto.response.PageResponse;
import com.example.tcc_backend.dto.response.UsuarioProfileResponse;
import com.example.tcc_backend.model.TipoUsuario;
import com.example.tcc_backend.service.AdminUserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/usuarios")
@RequiredArgsConstructor
public class AdminUsuarioController {

    private final AdminUserService service;

    @GetMapping
    public ResponseEntity<PageResponse<UsuarioProfileResponse>> list(
            @RequestParam(required = false) TipoUsuario tipo,
            @RequestParam(required = false) String busca,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(service.list(tipo, busca, page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<UsuarioProfileResponse> find(@PathVariable Integer id) {
        return ResponseEntity.ok(service.find(id));
    }

    @PostMapping
    public ResponseEntity<UsuarioProfileResponse> create(@RequestBody @Valid AdminUsuarioRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<UsuarioProfileResponse> update(
            @PathVariable Integer id,
            @RequestBody @Valid AdminUsuarioRequest request) {
        return ResponseEntity.ok(service.update(id, request));
    }

    @PatchMapping("/{id}/ativo")
    public ResponseEntity<UsuarioProfileResponse> setAtivo(
            @PathVariable Integer id,
            @RequestBody @Valid AdminAtivoRequest request) {
        return ResponseEntity.ok(service.setAtivo(id, request));
    }
}
