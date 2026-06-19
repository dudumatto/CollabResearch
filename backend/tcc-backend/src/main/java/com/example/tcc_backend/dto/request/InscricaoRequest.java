package com.example.tcc_backend.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InscricaoRequest {

    @NotNull(message = "Projeto e obrigatorio")
    private Integer projetoId;

    @Size(max = 1500, message = "Motivacao deve ter no maximo 1500 caracteres")
    private String motivacao;
}
