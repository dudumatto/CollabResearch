package com.example.tcc_backend.service;

import com.example.tcc_backend.dto.response.EtapaResponse;
import com.example.tcc_backend.dto.response.RevisaoResponse;
import com.example.tcc_backend.model.EtapaProgresso;
import com.example.tcc_backend.model.EtapaRevisao;
import com.example.tcc_backend.model.EtapaTarefa;
import com.example.tcc_backend.model.RevisaoAcao;
import com.example.tcc_backend.repository.EtapaRevisaoRepository;
import com.example.tcc_backend.repository.EtapaTarefaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/** Monta {@link EtapaResponse} em lote (uma consulta de tarefas e uma de revisoes por lista). */
@Component
@RequiredArgsConstructor
public class EtapaResponseAssembler {

    private final EtapaTarefaRepository tarefaRepository;
    private final EtapaRevisaoRepository revisaoRepository;

    public Map<Integer, List<EtapaTarefa>> tarefasPorEtapa(Collection<EtapaProgresso> etapas) {
        Map<Integer, List<EtapaTarefa>> mapa = new HashMap<>();
        if (etapas.isEmpty()) {
            return mapa;
        }
        List<Integer> ids = etapas.stream().map(EtapaProgresso::getId).toList();
        for (EtapaTarefa tarefa : tarefaRepository.findByEtapaIdInOrderByOrdemAscIdAsc(ids)) {
            mapa.computeIfAbsent(tarefa.getEtapa().getId(), k -> new java.util.ArrayList<>()).add(tarefa);
        }
        return mapa;
    }

    public List<EtapaResponse> montar(List<EtapaProgresso> etapas) {
        return montar(etapas, tarefasPorEtapa(etapas));
    }

    public List<EtapaResponse> montar(List<EtapaProgresso> etapas, Map<Integer, List<EtapaTarefa>> tarefas) {
        Map<Integer, RevisaoResponse> ultimas = ultimasRevisoes(etapas);
        return etapas.stream()
                .map(e -> EtapaResponse.of(e, tarefas.getOrDefault(e.getId(), List.of()), ultimas.get(e.getId())))
                .toList();
    }

    public EtapaResponse montar(EtapaProgresso etapa) {
        return montar(List.of(etapa)).get(0);
    }

    private Map<Integer, RevisaoResponse> ultimasRevisoes(Collection<EtapaProgresso> etapas) {
        Map<Integer, RevisaoResponse> mapa = new HashMap<>();
        if (etapas.isEmpty()) {
            return mapa;
        }
        List<Integer> ids = etapas.stream().map(EtapaProgresso::getId).toList();
        // mais recente primeiro: a primeira decisao (aprovado/devolvido) de cada marco e a ultima revisao
        for (EtapaRevisao revisao : revisaoRepository.findHistoricoDasEtapas(ids)) {
            if (revisao.getAcao() == RevisaoAcao.ENVIADO) {
                continue;
            }
            mapa.putIfAbsent(revisao.getEtapa().getId(), RevisaoResponse.fromEntity(revisao));
        }
        return mapa;
    }
}
