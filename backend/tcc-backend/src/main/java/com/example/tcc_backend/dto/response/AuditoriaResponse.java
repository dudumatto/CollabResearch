package com.example.tcc_backend.dto.response;

import com.example.tcc_backend.model.AuditoriaEvento;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class AuditoriaResponse {
    private Integer id;
    private String administrador;
    private String acao;
    private String recurso;
    private Integer recursoId;
    private String descricao;
    private LocalDateTime dataEvento;

    public static AuditoriaResponse fromEntity(AuditoriaEvento evento) {
        return AuditoriaResponse.builder()
                .id(evento.getId())
                .administrador(evento.getAdmin().getNome())
                .acao(evento.getAcao())
                .recurso(evento.getRecurso())
                .recursoId(evento.getRecursoId())
                .descricao(evento.getDescricao())
                .dataEvento(evento.getDataEvento())
                .build();
    }
}
