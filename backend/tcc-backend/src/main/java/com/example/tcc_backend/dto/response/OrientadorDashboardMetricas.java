package com.example.tcc_backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrientadorDashboardMetricas {

    private long projetosAtivos;
    private long solicitacoesOrientacao;
    private long inscricoesPendentes;
    private long orientandosAtivos;
    private long etapasAtrasadas;
    private long entregasAguardandoRevisao;
    private long avaliacoesAguardandoCiencia;
}
