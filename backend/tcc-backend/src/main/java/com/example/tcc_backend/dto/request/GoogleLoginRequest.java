package com.example.tcc_backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class GoogleLoginRequest {

    @NotBlank(message = "Token do Google obrigatorio")
    @Size(max = 4096, message = "Token do Google invalido")
    private String idToken;
}
