package com.example.tcc_backend.dto.response;

import java.util.List;

public record LumenRankingResponse(
        List<CandidatoRanking> ranking,
        String aviso
) {
    /** {@code pontuacao} e a nota 0-10 arredondada; a nota exata esta em {@code avaliacao.notaFinal()}. */
    public record CandidatoRanking(
            Integer inscricaoId,
            String nomeAluno,
            int pontuacao,
            String justificativa,
            LumenAvaliacao avaliacao
    ) {}
}
