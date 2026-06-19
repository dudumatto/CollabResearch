package com.example.tcc_backend.dto.request;

import com.example.tcc_backend.model.TipoProgresso;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ProgressoRequest {
    @Size(max = 150, message = "Titulo deve ter no maximo 150 caracteres")
    private String titulo;

    private TipoProgresso tipo;

    @Size(max = 100, message = "Fase deve ter no maximo 100 caracteres")
    private String fase;

    @NotBlank(message = "Descricao e obrigatoria")
    private String descricao;

    @Size(max = 4000, message = "Metadata deve ter no maximo 4000 caracteres")
    private String metadataJson;
}
