package com.example.tcc_backend.service;

import com.example.tcc_backend.model.EtapaProgresso;
import com.example.tcc_backend.model.EtapaProgressoStatus;
import com.example.tcc_backend.model.EtapaTarefa;
import com.example.tcc_backend.model.TarefaOrigem;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class MarcoProgressoCalculatorTest {

    private static final OffsetDateTime AGORA = OffsetDateTime.parse("2026-10-10T12:00:00Z");

    private static EtapaProgresso marco(int id, EtapaProgressoStatus status) {
        return EtapaProgresso.builder().id(id).titulo("Marco " + id).peso(id * 10).ordem(id).status(status).build();
    }

    private static List<EtapaTarefa> tarefas(EtapaProgresso etapa, int concluidas, int pendentes) {
        List<EtapaTarefa> lista = new ArrayList<>();
        for (int i = 0; i < concluidas + pendentes; i++) {
            lista.add(EtapaTarefa.builder().id(etapa.getId() * 100 + i).etapa(etapa).titulo("t" + i)
                    .origem(i % 2 == 0 ? TarefaOrigem.ORIENTADOR : TarefaOrigem.ALUNO)
                    .concluida(i < concluidas).ordem(i + 1).build());
        }
        return lista;
    }

    @Test
    void percentualDoMarcoArredondaItensConcluidosSobreTotal() {
        EtapaProgresso m = marco(1, EtapaProgressoStatus.ACTIVE);

        var tres = MarcoProgressoCalculator.marco(tarefas(m, 1, 2));
        assertThat(tres.itensConcluidos()).isEqualTo(1);
        assertThat(tres.itensTotal()).isEqualTo(3);
        assertThat(tres.percentual()).isEqualTo(33);
        assertThat(tres.semTarefas()).isFalse();

        assertThat(MarcoProgressoCalculator.marco(tarefas(m, 2, 1)).percentual()).isEqualTo(67);
        assertThat(MarcoProgressoCalculator.marco(tarefas(m, 3, 0)).percentual()).isEqualTo(100);
        assertThat(MarcoProgressoCalculator.marco(tarefas(m, 0, 3)).percentual()).isZero();
    }

    @Test
    void marcoSemTarefasTemZeroItensEPercentualZero() {
        var vazio = MarcoProgressoCalculator.marco(List.of());
        assertThat(vazio.itensTotal()).isZero();
        assertThat(vazio.itensConcluidos()).isZero();
        assertThat(vazio.percentual()).isZero();
        assertThat(vazio.semTarefas()).isTrue();

        assertThat(MarcoProgressoCalculator.marco(null).semTarefas()).isTrue();
    }

    @Test
    void progressoGeralSomaItensDeTodosOsMarcosSemUsarPeso() {
        EtapaProgresso a = marco(1, EtapaProgressoStatus.DONE);
        EtapaProgresso b = marco(2, EtapaProgressoStatus.ACTIVE);
        EtapaProgresso c = marco(3, EtapaProgressoStatus.PENDING);
        Map<Integer, List<EtapaTarefa>> mapa = new HashMap<>();
        mapa.put(1, tarefas(a, 1, 0));   // 1/1
        mapa.put(2, tarefas(b, 1, 5));   // 1/6
        // c sem tarefas: nao entra na soma de itens

        var resumo = MarcoProgressoCalculator.projeto(List.of(a, b, c), mapa, AGORA);

        assertThat(resumo.itensConcluidos()).isEqualTo(2);
        assertThat(resumo.itensTotal()).isEqualTo(7);
        assertThat(resumo.percentualGeral()).isEqualTo(29);
        assertThat(resumo.marcosTotal()).isEqualTo(3);
        assertThat(resumo.marcosConcluidos()).isEqualTo(1);
    }

    @Test
    void projetoSemMarcosOuSemItensRetornaZero() {
        var semMarcos = MarcoProgressoCalculator.projeto(List.of(), Map.of(), AGORA);
        assertThat(semMarcos.percentualGeral()).isZero();
        assertThat(semMarcos.marcosTotal()).isZero();
        assertThat(semMarcos.itensTotal()).isZero();

        var semItens = MarcoProgressoCalculator.projeto(
                List.of(marco(1, EtapaProgressoStatus.PENDING)), Map.of(), AGORA);
        assertThat(semItens.percentualGeral()).isZero();
        assertThat(semItens.marcosTotal()).isEqualTo(1);
    }

    @Test
    void cemPorCentoNaoIndicaAprovacao() {
        EtapaProgresso m = marco(1, EtapaProgressoStatus.ACTIVE);

        var resumo = MarcoProgressoCalculator.projeto(List.of(m), Map.of(1, tarefas(m, 4, 0)), AGORA);

        assertThat(resumo.percentualGeral()).isEqualTo(100);
        assertThat(resumo.marcosConcluidos()).isZero();
    }

    @Test
    void marcosEmRevisaoEComAtencaoSaoContadosPorEstadoEPrazo() {
        EtapaProgresso emRevisao = marco(1, EtapaProgressoStatus.ACTIVE);
        emRevisao.setEnviadaEm(LocalDateTime.of(2026, 10, 9, 10, 0));
        EtapaProgresso devolvido = marco(2, EtapaProgressoStatus.REJECTED);
        EtapaProgresso vencido = marco(3, EtapaProgressoStatus.ACTIVE);
        vencido.setPrazo(AGORA.minusDays(1));
        EtapaProgresso aprovadoVencido = marco(4, EtapaProgressoStatus.DONE);
        aprovadoVencido.setPrazo(AGORA.minusDays(30));
        EtapaProgresso noPrazo = marco(5, EtapaProgressoStatus.PENDING);
        noPrazo.setPrazo(AGORA.plusDays(3));

        var resumo = MarcoProgressoCalculator.projeto(
                List.of(emRevisao, devolvido, vencido, aprovadoVencido, noPrazo), Map.of(), AGORA);

        assertThat(resumo.marcosEmRevisao()).isEqualTo(1);
        assertThat(resumo.marcosComAtencao()).isEqualTo(2);
        assertThat(resumo.marcosConcluidos()).isEqualTo(1);
    }

    @Test
    void marcoAprovadoNuncaEstaEmRevisao() {
        EtapaProgresso m = marco(1, EtapaProgressoStatus.DONE);
        m.setEnviadaEm(LocalDateTime.now());

        assertThat(MarcoProgressoCalculator.emRevisao(m)).isFalse();
    }
}
