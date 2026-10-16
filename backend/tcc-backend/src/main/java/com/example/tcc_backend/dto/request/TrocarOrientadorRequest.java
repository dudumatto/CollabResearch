package com.example.tcc_backend.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class TrocarOrientadorRequest {
    @NotNull(message = "Orientador obrigatorio")
    private Integer orientadorId;
}
