package com.example.tcc_backend.dto.response;

import com.example.tcc_backend.model.EtapaRevisao;
import com.example.tcc_backend.model.RevisaoAcao;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RevisaoResponse {

    private Integer id;
    private RevisaoAcao acao;
    private String comentario;
    private Integer autorId;
    private String autorNome;
    private LocalDateTime criadoEm;

    public static RevisaoResponse fromEntity(EtapaRevisao revisao) {
        return RevisaoResponse.builder()
                .id(revisao.getId())
                .acao(revisao.getAcao())
                .comentario(revisao.getComentario())
                .autorId(revisao.getAutor() != null ? revisao.getAutor().getId() : null)
                .autorNome(revisao.getAutor() != null ? revisao.getAutor().getNome() : null)
                .criadoEm(revisao.getCriadoEm())
                .build();
    }
}
