package com.example.tcc_backend.dto.response;

import com.example.tcc_backend.model.DeliveryReview;
import com.example.tcc_backend.model.EntregaDecisao;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeliveryReviewResponse {

    private Long id;
    private Long versaoId;
    private Integer revisorId;
    private String revisorNome;
    private EntregaDecisao decisao;
    private String comentario;
    private OffsetDateTime revisadaEm;

    public static DeliveryReviewResponse fromEntity(DeliveryReview revisao) {
        return DeliveryReviewResponse.builder()
                .id(revisao.getId())
                .versaoId(revisao.getVersao() != null ? revisao.getVersao().getId() : null)
                .revisorId(revisao.getRevisor() != null ? revisao.getRevisor().getId() : null)
                .revisorNome(revisao.getRevisor() != null ? revisao.getRevisor().getNome() : null)
                .decisao(revisao.getDecisao())
                .comentario(revisao.getComentario())
                .revisadaEm(revisao.getRevisadaEm())
                .build();
    }
}
