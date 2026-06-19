package com.example.tcc_backend.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class UsuarioPreferenciasRequest {

    @NotNull(message = "Preferencia de notificacoes obrigatoria")
    private Boolean notificacoesAtivas;

    @Pattern(regexp = "claro|escuro|sistema", message = "Tema deve ser claro, escuro ou sistema")
    private String tema;
}
