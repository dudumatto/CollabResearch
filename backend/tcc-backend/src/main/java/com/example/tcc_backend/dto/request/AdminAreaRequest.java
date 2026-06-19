package com.example.tcc_backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AdminAreaRequest {
    @NotBlank(message = "Nome obrigatorio")
    @Size(max = 100)
    private String nome;
    private Integer cursoId;
}
