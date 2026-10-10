package com.example.tcc_backend.dto.response;

import com.example.tcc_backend.model.EtapaTarefa;
import com.example.tcc_backend.model.TarefaOrigem;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TarefaResponse {

    private Integer id;
    private String titulo;
    private Boolean obrigatoria;
    private TarefaOrigem origem;
    private Boolean concluida;
    private LocalDateTime concluidaEm;
    private Integer ordem;
    private Integer criadaPorId;
    private String criadaPorNome;

    public static TarefaResponse fromEntity(EtapaTarefa tarefa) {
        return TarefaResponse.builder()
                .id(tarefa.getId())
                .titulo(tarefa.getTitulo())
                .obrigatoria(Boolean.TRUE.equals(tarefa.getObrigatoria()))
                .origem(tarefa.getOrigem())
                .concluida(Boolean.TRUE.equals(tarefa.getConcluida()))
                .concluidaEm(tarefa.getConcluidaEm())
                .ordem(tarefa.getOrdem())
                .criadaPorId(tarefa.getCriadaPor() != null ? tarefa.getCriadaPor().getId() : null)
                .criadaPorNome(tarefa.getCriadaPor() != null ? tarefa.getCriadaPor().getNome() : null)
                .build();
    }
}
