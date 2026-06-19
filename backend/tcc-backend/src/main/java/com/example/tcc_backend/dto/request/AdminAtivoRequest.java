package com.example.tcc_backend.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AdminAtivoRequest {
    @NotNull(message = "Ativo obrigatorio")
    private Boolean ativo;
}
