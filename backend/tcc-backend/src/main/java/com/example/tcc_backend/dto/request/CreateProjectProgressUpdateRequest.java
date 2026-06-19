package com.example.tcc_backend.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateProjectProgressUpdateRequest {

    @NotBlank(message = "Titulo e obrigatorio")
    @Size(max = 120, message = "Titulo deve ter no maximo 120 caracteres")
    private String titulo;

    @Size(max = 4000, message = "Descricao deve ter no maximo 4000 caracteres")
    private String descricao;

    @NotBlank(message = "Categoria e obrigatoria")
    @Size(max = 30, message = "Categoria deve ter no maximo 30 caracteres")
    private String categoria;

    private Integer etapaId;

    @Min(value = 0, message = "Contribuicao deve ser entre 0 e 100")
    @Max(value = 100, message = "Contribuicao deve ser entre 0 e 100")
    private Integer etapaContribuicao;
}
