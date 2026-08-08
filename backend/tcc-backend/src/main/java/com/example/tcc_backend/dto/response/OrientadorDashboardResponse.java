package com.example.tcc_backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrientadorDashboardResponse {

    private OrientadorDashboardMetricas metricas;
    private OrientadorDashboardFilas filas;
}
