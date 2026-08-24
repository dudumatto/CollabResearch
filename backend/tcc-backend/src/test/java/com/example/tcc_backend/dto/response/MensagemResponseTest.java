package com.example.tcc_backend.dto.response;

import com.example.tcc_backend.model.Conversa;
import com.example.tcc_backend.model.Mensagem;
import com.example.tcc_backend.model.Usuario;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class MensagemResponseTest {

    @Test
    void fromEntityDeveExporFotoCanonicaEAliasDoRemetente() {
        Usuario remetente = Usuario.builder()
                .id(7)
                .nome("Aluno Teste")
                .fotoPerfilUrl("https://cdn.exemplo/foto-nova.png?v=123")
                .build();
        Conversa conversa = Conversa.builder().id(3).build();
        Mensagem mensagem = Mensagem.builder()
                .id(10)
                .conversa(conversa)
                .remetente(remetente)
                .conteudo("Oi")
                .build();

        MensagemResponse response = MensagemResponse.fromEntity(mensagem);

        assertThat(response.getRemetenteFotoPerfilUrl()).isEqualTo("https://cdn.exemplo/foto-nova.png?v=123");
        assertThat(response.getRemetenteAvatarUrl()).isEqualTo("https://cdn.exemplo/foto-nova.png?v=123");
    }
}