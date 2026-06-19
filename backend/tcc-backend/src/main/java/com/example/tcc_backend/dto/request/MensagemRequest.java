package com.example.tcc_backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import com.fasterxml.jackson.annotation.JsonAlias;

@Data
public class MensagemRequest {
    @NotBlank(message = "Conteudo e obrigatorio")
    @JsonAlias("content")
    private String conteudo;
}
