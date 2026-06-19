package com.example.tcc_backend.dto.response;

import com.example.tcc_backend.model.EtapaProgresso;
import com.example.tcc_backend.model.EtapaProgressoStatus;
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
    private LocalDateTime completedAt;
    private ProjectProgressUserResponse completedBy;

    public static ProgressStepResponse fromEntity(EtapaProgresso etapa) {
        return ProgressStepResponse.builder()
                .id(etapa.getId())
                .title(etapa.getTitulo())
                .description(etapa.getDescricao())
                .weight(etapa.getPeso())
                .stepOrder(etapa.getOrdem())
                .status(etapa.getStatus())
                .completedAt(etapa.getConcluidaEm())
                .completedBy(ProjectProgressUserResponse.fromEntity(etapa.getConcluidaPor()))
                .build();
    }
}
