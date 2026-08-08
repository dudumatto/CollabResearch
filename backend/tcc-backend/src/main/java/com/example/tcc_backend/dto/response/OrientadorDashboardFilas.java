package com.example.tcc_backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrientadorDashboardFilas {

    private List<OrientadorDashboardQueueItem> projetosAtivos;
    private List<OrientadorDashboardQueueItem> solicitacoesOrientacao;
    private List<OrientadorDashboardQueueItem> inscricoesPendentes;
    private List<OrientadorDashboardQueueItem> orientandosAtivos;
    private List<OrientadorDashboardQueueItem> etapasAtrasadas;
    private List<OrientadorDashboardQueueItem> entregasAguardandoRevisao;
    private List<OrientadorDashboardQueueItem> avaliacoesAguardandoCiencia;
}
