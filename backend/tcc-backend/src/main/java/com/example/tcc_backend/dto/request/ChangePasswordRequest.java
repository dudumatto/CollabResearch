package com.example.tcc_backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ChangePasswordRequest {

    @NotBlank(message = "Senha atual obrigatoria")
    private String senhaAtual;

    @NotBlank(message = "Nova senha obrigatoria")
    @Size(min = 8, max = 72, message = "Nova senha deve ter entre 8 e 72 caracteres")
    private String novaSenha;
}
