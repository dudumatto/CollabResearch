package com.example.tcc_backend.dto.response;

import com.example.tcc_backend.model.DeliveryVersion;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

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

    public static DeliveryVersionResponse fromEntity(DeliveryVersion versao, DeliveryReviewResponse revisao) {
        return DeliveryVersionResponse.builder()
                .id(versao.getId())
                .numeroVersao(versao.getNumeroVersao())
                .nomeArquivo(versao.getNomeArquivo())
                .contentType(versao.getContentType())
                .tamanhoBytes(versao.getTamanhoBytes())
                .enviadaEm(versao.getEnviadaEm())
                .revisao(revisao)
                .build();
    }
}
