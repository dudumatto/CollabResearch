package com.example.tcc_backend.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class ProjectProgressResponse {
    private Integer projectId;
    /** Mesmo valor de {@code percentualGeral}; mantido por compatibilidade. */
    private Integer overallPercent;
    private Integer percentualGeral;
    private Integer itensConcluidos;
    private Integer itensTotal;
    private Integer marcosTotal;
    private Integer marcosConcluidos;
    private Integer marcosEmRevisao;
    private Integer marcosComAtencao;
    private Integer atualizacoesTotal;
    private List<ProgressStepResponse> steps;
    private List<EtapaResponse> marcos;
    private List<ProjectProgressUpdateResponse> updates;
}
