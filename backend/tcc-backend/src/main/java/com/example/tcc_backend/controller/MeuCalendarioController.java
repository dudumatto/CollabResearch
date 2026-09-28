package com.example.tcc_backend.controller;

import com.example.tcc_backend.dto.response.EtapaCalendarioResponse;
import com.example.tcc_backend.service.EtapaProgressoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/me")
@RequiredArgsConstructor
public class MeuCalendarioController {

    private final EtapaProgressoService etapaProgressoService;

    @GetMapping("/prazos-etapas")
    public ResponseEntity<List<EtapaCalendarioResponse>> listarPrazosEtapas() {
        return ResponseEntity.ok(etapaProgressoService.listarPrazosEtapasDoUsuario());
    }
}
