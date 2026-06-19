package com.example.tcc_backend.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class InscricaoAvaliacaoRequest {

    @Size(max = 1500, message = "Parecer deve ter no maximo 1500 caracteres")
    private String parecerOrientador;
}
