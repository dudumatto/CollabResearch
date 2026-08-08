package com.example.tcc_backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class EntregaRequest {

    @NotBlank(message = "Titulo e obrigatorio")
    @Size(max = 180, message = "Titulo deve ter no maximo 180 caracteres")
    private String titulo;

    @NotBlank(message = "Categoria e obrigatoria")
    @Size(max = 100, message = "Categoria deve ter no maximo 100 caracteres")
    private String categoria;

    private Integer etapaId;
}
