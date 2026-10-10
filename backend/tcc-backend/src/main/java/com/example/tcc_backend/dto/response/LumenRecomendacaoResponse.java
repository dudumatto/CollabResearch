package com.example.tcc_backend.dto.response;

import java.util.List;

public record LumenRecomendacaoResponse(
        List<ProjetoRecomendado> recomendacoes,
        String aviso
) {
    public record ProjetoRecomendado(
            Integer projetoId,
            String titulo,
            String area,
            int pontuacao,
            String justificativa
    ) {}
}
