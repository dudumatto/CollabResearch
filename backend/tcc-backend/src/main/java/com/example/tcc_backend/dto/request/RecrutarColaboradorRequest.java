package com.example.tcc_backend.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class RecrutarColaboradorRequest {
    @NotNull(message = "Usuario e obrigatorio")
    private Integer usuarioId;
}
