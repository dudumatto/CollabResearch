package com.example.tcc_backend.dto.response;

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
public class OrientandoEtapaResponse {

    private Integer id;
    private String titulo;
    private String descricao;
    private Integer ordem;
    private Integer peso;
    private Boolean obrigatoria;
    private EtapaProgressoStatus status;
    private EtapaResponsavel responsavel;
    private OffsetDateTime prazo;
    private LocalDateTime concluidaEm;
    private String concluidaPorNome;
}
