package com.example.tcc_backend.dto.response;

import java.util.List;

/** Avaliacao detalhada da Lumen AI (nota 0-10 ponderada por 5 criterios), persistida como JSON na inscricao. */
public record LumenAvaliacao(
        double notaFinal,
        String confianca,
        String resumo,
        List<Criterio> criterios,
        List<String> pontosFortes,
        List<String> pontosAtencao
) {
    /** {@code nota} nulo = criterio sem informacao (peso redistribuido entre os demais). */
    public record Criterio(String chave, String nome, int peso, Double nota, String justificativa) {}
}
