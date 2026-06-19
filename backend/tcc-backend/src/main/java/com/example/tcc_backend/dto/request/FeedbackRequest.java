package com.example.tcc_backend.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class FeedbackRequest {
    @NotNull(message = "Projeto e obrigatorio")
    private Integer projetoId;

    @NotNull(message = "Nota e obrigatoria")
    @Min(value = 1, message = "Nota minima e 1")
    @Max(value = 5, message = "Nota maxima e 5")
    private Integer nota;

    @Size(max = 1000, message = "Comentario deve ter no maximo 1000 caracteres")
    private String comentario;
}
