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
    private final UsuarioService usuarioService;

    public void publicarMensagemCriada(Mensagem mensagem) {
        MensagemResponse response = MensagemResponse.fromEntity(mensagem, usuarioService::resolverFotoPerfilParaExibicao);
        publicar(response.getConversaId(), ChatMessageEvent.criada(response));
    }

    public void publicarMensagemEditada(MensagemResponse mensagem) {
        publicar(mensagem.getConversaId(), ChatMessageEvent.editada(mensagem));
    }

    public void publicarMensagemExcluida(MensagemResponse mensagem) {
        publicar(mensagem.getConversaId(), ChatMessageEvent.excluida(mensagem));
    }

    public void publicarMensagensLidas(Integer conversaId, java.util.List<Integer> mensagemIds) {
        publicar(conversaId, ChatMessageEvent.lidas(conversaId, mensagemIds));
    }

    private void publicar(Integer conversaId, ChatMessageEvent event) {
        if (conversaId == null) return;
        messagingTemplate.convertAndSend("/topic/conversa/" + conversaId, event);
    }
}
