package com.example.tcc_backend.dto.response;

import com.example.tcc_backend.model.EtapaProgresso;
import com.example.tcc_backend.model.EtapaProgressoStatus;
import com.example.tcc_backend.model.EtapaResponsavel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EtapaResponse {

    private Integer id;
    private Integer projetoId;
    private String titulo;
    private String descricao;
    private Integer peso;
    private Integer ordem;
    private EtapaProgressoStatus status;
    private EtapaResponsavel responsavel;
    private OffsetDateTime prazo;
    private Boolean obrigatoria;
    private LocalDateTime concluidaEm;
    private Integer concluidaPorId;
    private String concluidaPorNome;

    public static EtapaResponse fromEntity(EtapaProgresso etapa) {
        return EtapaResponse.builder()
                .id(etapa.getId())
                .projetoId(etapa.getProjeto() != null ? etapa.getProjeto().getId() : null)
                .titulo(etapa.getTitulo())
                .descricao(etapa.getDescricao())
                .peso(etapa.getPeso())
                .ordem(etapa.getOrdem())
                .status(etapa.getStatus())
                .responsavel(etapa.getResponsavel())
                .prazo(etapa.getPrazo())
                .obrigatoria(etapa.getObrigatoria())
                .concluidaEm(etapa.getConcluidaEm())
                .concluidaPorId(etapa.getConcluidaPor() != null ? etapa.getConcluidaPor().getId() : null)
                .concluidaPorNome(etapa.getConcluidaPor() != null ? etapa.getConcluidaPor().getNome() : null)
                .build();
    }
}
