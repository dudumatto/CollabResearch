package com.example.tcc_backend.dto.response;

import com.example.tcc_backend.model.EtapaProgresso;
import com.example.tcc_backend.model.EtapaProgressoStatus;
import com.example.tcc_backend.model.EtapaTarefa;
import com.example.tcc_backend.model.EtapaResponsavel;
import com.example.tcc_backend.service.MarcoProgressoCalculator;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EtapaResponse {

    private Integer id;
    private Integer projetoId;
    private String titulo;
    private String descricao;
    private Integer peso;
    private Integer ordem;
    private EtapaProgressoStatus status;
    private EtapaResponsavel responsavel;
    private OffsetDateTime prazo;
    private Boolean obrigatoria;
    private LocalDateTime criadaEm;
    private LocalDateTime concluidaEm;
    private Integer concluidaPorId;
    private String concluidaPorNome;
    private Boolean emRevisao;
    private LocalDateTime enviadaEm;
    private Integer itensConcluidos;
    private Integer itensTotal;
    private Integer percentual;
    private Boolean semTarefas;
    private List<TarefaResponse> tarefas;
    private RevisaoResponse ultimaRevisao;

    public static EtapaResponse of(EtapaProgresso etapa, List<EtapaTarefa> tarefas, RevisaoResponse ultimaRevisao) {
        MarcoProgressoCalculator.Marco calculo = MarcoProgressoCalculator.marco(tarefas);
        return EtapaResponse.builder()
                .id(etapa.getId())
                .projetoId(etapa.getProjeto() != null ? etapa.getProjeto().getId() : null)
                .titulo(etapa.getTitulo())
                .descricao(etapa.getDescricao())
                .peso(etapa.getPeso())
                .ordem(etapa.getOrdem())
                .status(etapa.getStatus())
                .responsavel(etapa.getResponsavel())
                .prazo(etapa.getPrazo())
                .obrigatoria(etapa.getObrigatoria())
                .criadaEm(etapa.getCriadaEm())
                .concluidaEm(etapa.getConcluidaEm())
                .concluidaPorId(etapa.getConcluidaPor() != null ? etapa.getConcluidaPor().getId() : null)
                .concluidaPorNome(etapa.getConcluidaPor() != null ? etapa.getConcluidaPor().getNome() : null)
                .emRevisao(MarcoProgressoCalculator.emRevisao(etapa))
                .enviadaEm(etapa.getEnviadaEm())
                .itensConcluidos(calculo.itensConcluidos())
                .itensTotal(calculo.itensTotal())
                .percentual(calculo.percentual())
                .semTarefas(calculo.semTarefas())
                .tarefas(tarefas == null ? List.of() : tarefas.stream().map(TarefaResponse::fromEntity).toList())
                .ultimaRevisao(ultimaRevisao)
                .build();
    }
}
