package com.example.tcc_backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class TarefaRequest {

    @NotBlank(message = "Titulo e obrigatorio")
    @Size(max = 200, message = "Titulo deve ter no maximo 200 caracteres")
    private String titulo;

    private Boolean obrigatoria;
}
