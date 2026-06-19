package com.example.tcc_backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessageEvent {

    private String tipo;
    private Integer conversaId;
    private Integer mensagemId;
    private MensagemResponse mensagem;

    public static ChatMessageEvent criada(MensagemResponse mensagem) {
        return ChatMessageEvent.builder()
                .tipo("MENSAGEM_CRIADA")
                .conversaId(mensagem.getConversaId())
                .mensagemId(mensagem.getId())
                .mensagem(mensagem)
                .build();
    }

    public static ChatMessageEvent editada(MensagemResponse mensagem) {
        return ChatMessageEvent.builder()
                .tipo("MENSAGEM_EDITADA")
                .conversaId(mensagem.getConversaId())
                .mensagemId(mensagem.getId())
                .mensagem(mensagem)
                .build();
    }

    public static ChatMessageEvent excluida(Integer conversaId, Integer mensagemId) {
        return ChatMessageEvent.builder()
                .tipo("MENSAGEM_EXCLUIDA")
                .conversaId(conversaId)
                .mensagemId(mensagemId)
                .build();
    }
}
