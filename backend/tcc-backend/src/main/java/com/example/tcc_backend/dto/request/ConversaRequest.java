package com.example.tcc_backend.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ConversaRequest {
    @NotNull(message = "Projeto e obrigatorio")
    private Integer projetoId;
}
