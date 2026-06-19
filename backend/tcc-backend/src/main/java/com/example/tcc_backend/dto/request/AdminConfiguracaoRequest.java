package com.example.tcc_backend.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AdminConfiguracaoRequest {
    @NotNull(message = "Valor obrigatorio")
    @Size(max = 500)
    private String valor;

    @Size(max = 200)
    private String descricao;
}
