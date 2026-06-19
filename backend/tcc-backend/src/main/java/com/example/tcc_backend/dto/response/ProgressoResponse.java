package com.example.tcc_backend.dto.response;

import com.example.tcc_backend.model.Progresso;
import com.example.tcc_backend.model.TipoProgresso;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ProgressoResponse {
    private Integer id;
    private Integer projetoId;
    private String titulo;
    private TipoProgresso tipo;
    private String fase;
    private String descricao;
    private String metadataJson;
    private String categoria;
    private Integer etapaId;
    private String etapaTitulo;
    private Integer stepContribution;
    private LocalDateTime dataRegistro;
    private Integer autorId;
    private String autorNome;

    public static ProgressoResponse fromEntity(Progresso progresso) {
        return ProgressoResponse.builder()
                .id(progresso.getId())
                .projetoId(progresso.getProjeto().getId())
                .titulo(progresso.getTitulo())
                .tipo(progresso.getTipo())
                .fase(progresso.getFase())
                .descricao(progresso.getDescricao())
                .metadataJson(progresso.getMetadataJson())
                .categoria(progresso.getCategoria())
                .etapaId(progresso.getEtapa() != null ? progresso.getEtapa().getId() : null)
                .etapaTitulo(progresso.getEtapa() != null ? progresso.getEtapa().getTitulo() : null)
                .stepContribution(progresso.getStepContribution())
                .dataRegistro(progresso.getDataRegistro())
                .autorId(progresso.getAutor() != null ? progresso.getAutor().getId() : null)
                .autorNome(progresso.getAutor() != null ? progresso.getAutor().getNome() : null)
                .build();
    }
}
