package com.example.tcc_backend.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AvaliacaoAcademicaRequest {

    @NotNull(message = "Aluno e obrigatorio")
    private Integer alunoId;

    @NotNull(message = "Etapa e obrigatoria")
    private Integer etapaId;

    @NotNull(message = "Nota de participacao e obrigatoria")
    @Min(value = 1, message = "Nota de participacao deve estar entre 1 e 5")
    @Max(value = 5, message = "Nota de participacao deve estar entre 1 e 5")
    private Integer participacao;

    @NotNull(message = "Nota de qualidade tecnica e obrigatoria")
    @Min(value = 1, message = "Nota de qualidade tecnica deve estar entre 1 e 5")
    @Max(value = 5, message = "Nota de qualidade tecnica deve estar entre 1 e 5")
    private Integer qualidadeTecnica;

    @NotNull(message = "Nota de cumprimento de prazos e obrigatoria")
    @Min(value = 1, message = "Nota de cumprimento de prazos deve estar entre 1 e 5")
    @Max(value = 5, message = "Nota de cumprimento de prazos deve estar entre 1 e 5")
    private Integer cumprimentoDePrazos;

    @NotNull(message = "Nota de comunicacao e obrigatoria")
    @Min(value = 1, message = "Nota de comunicacao deve estar entre 1 e 5")
    @Max(value = 5, message = "Nota de comunicacao deve estar entre 1 e 5")
    private Integer comunicacao;

    @Size(max = 2000, message = "Comentario deve ter no maximo 2000 caracteres")
    private String comentarioOrientador;
}
