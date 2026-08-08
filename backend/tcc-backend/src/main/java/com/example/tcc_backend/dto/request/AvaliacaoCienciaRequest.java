package com.example.tcc_backend.dto.request;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AvaliacaoCienciaRequest {

    @Size(max = 2000, message = "Comentario deve ter no maximo 2000 caracteres")
    private String comentarioAluno;
}
