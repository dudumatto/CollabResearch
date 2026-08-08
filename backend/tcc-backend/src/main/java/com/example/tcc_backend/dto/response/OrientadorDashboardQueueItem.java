package com.example.tcc_backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrientadorDashboardQueueItem {

    private Long id;
    private String titulo;
    private String subtitulo;
    private String destino;
    private String status;
}
