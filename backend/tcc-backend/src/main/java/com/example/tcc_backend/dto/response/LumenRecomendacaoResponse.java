package com.example.tcc_backend.dto.response;

import java.util.List;

public record LumenRecomendacaoResponse(
        List<ProjetoRecomendado> recomendacoes,
        String aviso
) {
    /** A nota de similaridade e interna (selecao/ordenacao) e nunca sai para o aluno. */
    public record ProjetoRecomendado(
            Integer projetoId,
            String titulo,
            String area,
            String justificativa
    ) {}
}
