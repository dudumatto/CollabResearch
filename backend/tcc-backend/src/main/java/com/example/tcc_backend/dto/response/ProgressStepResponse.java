package com.example.tcc_backend.dto.response;

import com.example.tcc_backend.model.EtapaProgresso;
import com.example.tcc_backend.model.EtapaProgressoStatus;
import com.example.tcc_backend.model.EtapaResponsavel;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ProgressStepResponse {
    private Integer id;
    private String title;
    private String description;
    private Integer weight;
    private Integer stepOrder;
    private EtapaProgressoStatus status;
    private EtapaResponsavel responsavel;
    private LocalDateTime completedAt;
    private ProjectProgressUserResponse completedBy;
    private Boolean emRevisao;
    private Integer itensConcluidos;
    private Integer itensTotal;
    private Integer percentual;
    private java.time.OffsetDateTime prazo;

    public static ProgressStepResponse fromEntity(EtapaProgresso etapa) {
        return fromEntity(etapa, null);
    }

    public static ProgressStepResponse fromEntity(EtapaProgresso etapa, java.util.List<com.example.tcc_backend.model.EtapaTarefa> tarefas) {
        var calculo = com.example.tcc_backend.service.MarcoProgressoCalculator.marco(tarefas);
        return ProgressStepResponse.builder()
                .id(etapa.getId())
                .title(etapa.getTitulo())
                .description(etapa.getDescricao())
                .weight(etapa.getPeso())
                .stepOrder(etapa.getOrdem())
                .status(etapa.getStatus())
                .responsavel(etapa.getResponsavel())
                .completedAt(etapa.getConcluidaEm())
                .completedBy(ProjectProgressUserResponse.fromEntity(etapa.getConcluidaPor()))
                .emRevisao(com.example.tcc_backend.service.MarcoProgressoCalculator.emRevisao(etapa))
                .itensConcluidos(calculo.itensConcluidos())
                .itensTotal(calculo.itensTotal())
                .percentual(calculo.percentual())
                .prazo(etapa.getPrazo())
                .build();
    }
}
