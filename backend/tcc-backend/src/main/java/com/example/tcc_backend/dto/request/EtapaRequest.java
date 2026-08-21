package com.example.tcc_backend.dto.request;

import com.example.tcc_backend.model.EtapaResponsavel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.OffsetDateTime;

@Data
public class EtapaRequest {

    @NotBlank(message = "Titulo e obrigatorio")
    @Size(max = 120, message = "Titulo deve ter no maximo 120 caracteres")
    private String titulo;

    @Size(max = 4000, message = "Descricao deve ter no maximo 4000 caracteres")
    private String descricao;

    private Integer peso;

    private EtapaResponsavel responsavel;

    @NotNull(message = "Data de entrega e obrigatoria")
    private OffsetDateTime prazo;

    private Boolean obrigatoria;
}
