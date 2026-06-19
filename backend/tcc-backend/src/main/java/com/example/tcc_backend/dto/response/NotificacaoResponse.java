package com.example.tcc_backend.dto.response;

import com.example.tcc_backend.model.Notificacao;
import com.example.tcc_backend.model.TipoNotificacao;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificacaoResponse {

    private Integer id;
    private String mensagem;
    private TipoNotificacao tipo;
    private Boolean lida;
    private LocalDateTime dataCriacao;
    private String entidadeRelacionada;
    private Integer entidadeId;
    private String rotaSugerida;
    private String payloadResumo;

    public static NotificacaoResponse fromEntity(Notificacao notificacao) {
        return NotificacaoResponse.builder()
                .id(notificacao.getId())
                .mensagem(notificacao.getMensagem())
                .tipo(notificacao.getTipo())
                .lida(notificacao.getLida())
                .dataCriacao(notificacao.getDataCriacao())
                .entidadeRelacionada(notificacao.getEntidadeRelacionada())
                .entidadeId(notificacao.getEntidadeId())
                .rotaSugerida(notificacao.getRotaSugerida())
                .payloadResumo(notificacao.getPayloadResumo())
                .build();
    }
}
