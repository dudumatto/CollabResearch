package com.example.tcc_backend.dto.response;

import com.example.tcc_backend.model.EtapaProgresso;
import com.example.tcc_backend.model.EtapaProgressoStatus;
import com.example.tcc_backend.model.EtapaResponsavel;
import lombok.Builder;
import lombok.Value;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;

@Value
@Builder
public class EtapaCalendarioResponse {
    Integer projetoId;
    String projetoTitulo;
    Integer id;
    String titulo;
    EtapaProgressoStatus status;
    EtapaResponsavel responsavel;
    OffsetDateTime prazo;
    LocalDateTime criadaEm;

    public static EtapaCalendarioResponse fromEntity(EtapaProgresso etapa) {
        return EtapaCalendarioResponse.builder()
                .projetoId(etapa.getProjeto().getId())
                .projetoTitulo(etapa.getProjeto().getTitulo())
                .id(etapa.getId())
                .titulo(etapa.getTitulo())
                .status(etapa.getStatus())
                .responsavel(etapa.getResponsavel())
                .prazo(etapa.getPrazo())
                .criadaEm(etapa.getCriadaEm())
                .build();
    }
}
