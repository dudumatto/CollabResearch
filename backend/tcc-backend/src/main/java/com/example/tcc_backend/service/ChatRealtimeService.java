package com.example.tcc_backend.service;

import com.example.tcc_backend.dto.response.ChatMessageEvent;
import com.example.tcc_backend.dto.response.MensagemResponse;
import com.example.tcc_backend.model.Mensagem;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ChatRealtimeService {

    private final SimpMessagingTemplate messagingTemplate;

    public void publicarMensagemCriada(Mensagem mensagem) {
        MensagemResponse response = MensagemResponse.fromEntity(mensagem);
        publicar(response.getConversaId(), ChatMessageEvent.criada(response));
    }

    public void publicarMensagemEditada(MensagemResponse mensagem) {
        publicar(mensagem.getConversaId(), ChatMessageEvent.editada(mensagem));
    }

    public void publicarMensagemExcluida(Integer conversaId, Integer mensagemId) {
        publicar(conversaId, ChatMessageEvent.excluida(conversaId, mensagemId));
    }

    private void publicar(Integer conversaId, ChatMessageEvent event) {
        if (conversaId == null) return;
        messagingTemplate.convertAndSend("/topic/conversa/" + conversaId, event);
    }
}
