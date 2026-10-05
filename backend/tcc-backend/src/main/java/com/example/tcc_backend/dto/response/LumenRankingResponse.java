package com.example.tcc_backend.dto.response;

import java.util.List;

public record LumenRankingResponse(
        List<CandidatoRanking> ranking,
        String aviso
) {
    public record CandidatoRanking(
            Integer inscricaoId,
            String nomeAluno,
            int pontuacao,
            String justificativa
    ) {}
}
