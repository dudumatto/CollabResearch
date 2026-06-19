package com.example.tcc_backend.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
public class AdminReportResponse {
    private LocalDateTime geradoEm;
    private Map<String, Long> usuariosPorTipo;
    private Map<String, Long> projetosPorStatus;
    private Map<String, Long> inscricoesPorStatus;
    private Map<String, Long> documentosPorStatus;
}
