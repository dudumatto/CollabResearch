package com.example.tcc_backend.dto.response;

import com.example.tcc_backend.model.DeliveryReview;
import com.example.tcc_backend.model.DeliveryVersion;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeliveryVersionResponse {

    private Long id;
    private Integer numeroVersao;
    private String nomeArquivo;
    private String contentType;
    private Long tamanhoBytes;
    private OffsetDateTime enviadaEm;
    private DeliveryReviewResponse revisao;

    public static DeliveryVersionResponse fromEntity(DeliveryVersion versao, DeliveryReview revisao) {
        return DeliveryVersionResponse.builder()
                .id(versao.getId())
                .numeroVersao(versao.getNumeroVersao())
                .nomeArquivo(versao.getNomeArquivo())
                .contentType(versao.getContentType())
                .tamanhoBytes(versao.getTamanhoBytes())
                .enviadaEm(versao.getEnviadaEm())
                .revisao(revisao != null ? DeliveryReviewResponse.fromEntity(revisao) : null)
                .build();
    }

    public static DeliveryVersionResponse fromEntity(DeliveryVersion versao, List<DeliveryReview> revisoes) {
        DeliveryReview revisao = revisoes == null ? null : revisoes.stream()
                .filter(r -> r.getVersao() != null && r.getVersao().getId().equals(versao.getId()))
                .findFirst()
                .orElse(null);
        return fromEntity(versao, revisao);
    }
}
