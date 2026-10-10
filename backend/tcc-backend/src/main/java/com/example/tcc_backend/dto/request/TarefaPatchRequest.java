package com.example.tcc_backend.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class TarefaPatchRequest {

    @Size(max = 200, message = "Titulo deve ter no maximo 200 caracteres")
    private String titulo;

    private Boolean obrigatoria;

    private Boolean concluida;
}
