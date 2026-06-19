package com.example.tcc_backend.dto.response;

import com.example.tcc_backend.model.Progresso;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ProjectProgressUpdateResponse {
    private Integer id;
    private String title;
    private String description;
    private String category;
    private Integer stepId;
    private String stepTitle;
    private Integer stepContribution;
    private ProjectProgressUserResponse createdBy;
    private LocalDateTime createdAt;

    public static ProjectProgressUpdateResponse fromEntity(Progresso progresso) {
        return ProjectProgressUpdateResponse.builder()
                .id(progresso.getId())
                .title(progresso.getTitulo())
                .description(progresso.getDescricao())
                .category(progresso.getCategoria())
                .stepId(progresso.getEtapa() != null ? progresso.getEtapa().getId() : null)
                .stepTitle(progresso.getEtapa() != null ? progresso.getEtapa().getTitulo() : null)
                .stepContribution(progresso.getStepContribution())
                .createdBy(ProjectProgressUserResponse.fromEntity(progresso.getAutor()))
                .createdAt(progresso.getDataRegistro())
                .build();
    }
}
