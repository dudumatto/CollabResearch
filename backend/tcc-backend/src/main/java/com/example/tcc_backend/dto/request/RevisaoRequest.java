package com.example.tcc_backend.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RevisaoRequest {

    public enum Decisao { APROVAR, DEVOLVER }

    @NotNull(message = "Acao e obrigatoria")
    private Decisao acao;

    @Size(max = 2000, message = "Comentario deve ter no maximo 2000 caracteres")
    private String comentario;
}
