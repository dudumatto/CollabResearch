package com.example.tcc_backend.dto.request;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;
import java.util.Collection;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjetoRequest {

    @NotBlank(message = "Título é obrigatório")
    private String titulo;

    private String descricao;

    private Object requisitos;

    @JsonAlias({"competencias", "technologies", "tecnologia", "technology"})
    private Object tecnologias;

    @NotNull(message = "Vagas é obrigatório")
    private Integer vagas;

    private LocalDate dataInicio;
    private LocalDate dataFim;
    private LocalDate dataLimiteInscricao;

    @NotNull(message = "Área é obrigatória")
    private Integer areaId;

    private Integer orientadorId;

    public String getRequisitos() {
        return normalizeTextList(requisitos);
    }

    public String getTecnologias() {
        return normalizeTextList(tecnologias);
    }

    private String normalizeTextList(Object value) {
        if (value == null) {
            return null;
        }

        if (value instanceof Collection<?> items) {
            String normalized = items.stream()
                    .map(item -> item == null ? "" : String.valueOf(item).trim())
                    .filter(item -> !item.isEmpty())
                    .reduce((left, right) -> left + ", " + right)
                    .orElse("");
            return normalized.isEmpty() ? null : normalized;
        }

        String normalized = String.valueOf(value).trim();
        return normalized.isEmpty() ? null : normalized;
    }
}
