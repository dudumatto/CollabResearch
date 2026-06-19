package com.example.tcc_backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardResponse {

    private Integer usuarioId;
    private String nomeUsuario;
    private String tipoUsuario;
    private long totalProjetos;
    private long meusProjetos;
    private long minhasInscricoes;
    private long inscricoesPendentes;
    private long notificacoesNaoLidas;
    private long conversasAtivas;
    private long documentosEnviados;
}
