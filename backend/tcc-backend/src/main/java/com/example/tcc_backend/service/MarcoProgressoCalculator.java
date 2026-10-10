package com.example.tcc_backend.service;

import com.example.tcc_backend.model.EtapaProgresso;
import com.example.tcc_backend.model.EtapaProgressoStatus;
import com.example.tcc_backend.model.EtapaTarefa;

import java.time.OffsetDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Map;

/**
 * Unico lugar com as regras de calculo do progresso por marcos.
 * Percentual = itens concluidos / itens totais (tarefas do orientador + pessoais).
 * O estado de revisao e independente do percentual.
 */
public final class MarcoProgressoCalculator {

    private MarcoProgressoCalculator() {
    }

    public record Marco(int itensConcluidos, int itensTotal, int percentual, boolean semTarefas) {
    }

    public record Projeto(int percentualGeral, int itensConcluidos, int itensTotal, int marcosTotal,
                          int marcosConcluidos, int marcosEmRevisao, int marcosComAtencao) {
    }

    public static Marco marco(Collection<EtapaTarefa> tarefas) {
        int total = tarefas == null ? 0 : tarefas.size();
        int concluidos = tarefas == null ? 0 : (int) tarefas.stream().filter(t -> Boolean.TRUE.equals(t.getConcluida())).count();
        return new Marco(concluidos, total, percentual(concluidos, total), total == 0);
    }

    public static Projeto projeto(List<EtapaProgresso> etapas, Map<Integer, ? extends Collection<EtapaTarefa>> tarefasPorEtapa,
                                  OffsetDateTime agora) {
        int concluidos = 0;
        int total = 0;
        int aprovados = 0;
        int emRevisao = 0;
        int atencao = 0;
        for (EtapaProgresso etapa : etapas) {
            Marco m = marco(tarefasPorEtapa.get(etapa.getId()));
            concluidos += m.itensConcluidos();
            total += m.itensTotal();
            if (etapa.getStatus() == EtapaProgressoStatus.DONE) {
                aprovados++;
            }
            if (emRevisao(etapa)) {
                emRevisao++;
            }
            if (precisaAtencao(etapa, agora)) {
                atencao++;
            }
        }
        return new Projeto(percentual(concluidos, total), concluidos, total, etapas.size(), aprovados, emRevisao, atencao);
    }

    /** Marco devolvido para ajustes ou com prazo vencido e ainda nao aprovado. */
    public static boolean precisaAtencao(EtapaProgresso etapa, OffsetDateTime agora) {
        if (etapa.getStatus() == EtapaProgressoStatus.DONE) {
            return false;
        }
        return etapa.getStatus() == EtapaProgressoStatus.REJECTED
                || (etapa.getPrazo() != null && etapa.getPrazo().isBefore(agora));
    }

    public static boolean emRevisao(EtapaProgresso etapa) {
        return etapa.getEnviadaEm() != null && etapa.getStatus() != EtapaProgressoStatus.DONE;
    }

    public static int percentual(int concluidos, int total) {
        return total <= 0 ? 0 : (int) Math.round(concluidos * 100.0 / total);
    }
}
