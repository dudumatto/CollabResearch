package com.example.tcc_backend.dto.response;

import com.example.tcc_backend.model.EntregaStatus;
import com.example.tcc_backend.model.ProjectDelivery;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EntregaResponse {

    private Long id;
    private Integer projetoId;
    private Integer etapaId;
    private String etapaTitulo;
    private Integer autorId;
    private String autorNome;
    private String titulo;
    private String categoria;
    private EntregaStatus status;
    private OffsetDateTime criadaEm;
    private OffsetDateTime atualizadaEm;
    private Long ultimaVersaoId;
    private Integer totalVersoes;

    public static EntregaResponse fromEntity(ProjectDelivery entrega, Long ultimaVersaoId, Integer totalVersoes) {
        return EntregaResponse.builder()
                .id(entrega.getId())
                .projetoId(entrega.getProjeto() != null ? entrega.getProjeto().getId() : null)
                .etapaId(entrega.getEtapa() != null ? entrega.getEtapa().getId() : null)
                .etapaTitulo(entrega.getEtapa() != null ? entrega.getEtapa().getTitulo() : null)
                .autorId(entrega.getAutor() != null ? entrega.getAutor().getId() : null)
                .autorNome(entrega.getAutor() != null ? entrega.getAutor().getNome() : null)
                .titulo(entrega.getTitulo())
                .categoria(entrega.getCategoria())
                .status(entrega.getStatus())
                .criadaEm(entrega.getCriadaEm())
                .atualizadaEm(entrega.getAtualizadaEm())
                .ultimaVersaoId(ultimaVersaoId)
                .totalVersoes(totalVersoes)
                .build();
    }
}
