package com.example.tcc_backend.dto.response;

import com.example.tcc_backend.model.Conversa;
import com.example.tcc_backend.model.Mensagem;
import com.example.tcc_backend.model.TipoConversa;
import com.example.tcc_backend.model.Usuario;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConversaResponse {

    private Integer id;
    private OffsetDateTime dataCriacao;
    private String tipo;

    // Campos de grupo (nullable para privadas)
    private Integer projetoId;
    private String projetoTitulo;
    private Integer orientadorId;
    private String orientadorNome;
    private String orientadorFotoPerfilUrl;
    private Integer alunoCriadorId;
    private String alunoCriadorNome;
    private String alunoCriadorFotoPerfilUrl;

    // Campos de privada (nullable para grupos)
    private Integer outroUsuarioId;
    private String outroUsuarioNome;
    private String outroUsuarioFotoPerfilUrl;

    // Nome a exibir na lista
    private String titulo;
    private String fotoPerfilUrl;

    // Ultima mensagem
    private String ultimaMensagem;
    private OffsetDateTime ultimaMensagemHorario;
    private long mensagensNaoLidas;

    public static ConversaResponse fromEntity(Conversa conversa, Integer usuarioLogadoId) {
        return fromEntity(conversa, usuarioLogadoId, 0);
    }

    public static ConversaResponse fromEntity(Conversa conversa, Integer usuarioLogadoId, long mensagensNaoLidas) {
        ConversaResponseBuilder builder = ConversaResponse.builder()
                .id(conversa.getId())
                .dataCriacao(conversa.getDataCriacao())
                .mensagensNaoLidas(mensagensNaoLidas)
                .tipo(conversa.getTipo().name());

        // Ultima mensagem (lista ja vem ordenada DESC pelo @OrderBy)
        if (conversa.getMensagens() != null && !conversa.getMensagens().isEmpty()) {
            Mensagem ultima = conversa.getMensagens().get(0);
            builder
                    .ultimaMensagem(ultima.getConteudo())
                    .ultimaMensagemHorario(ultima.getDataEnvio());
        }

        if (conversa.getTipo() == TipoConversa.PRIVADA) {
            Usuario outro = conversa.getParticipantes().stream()
                    .filter(p -> !p.getId().equals(usuarioLogadoId))
                    .findFirst()
                    .orElse(null);

            builder
                    .outroUsuarioId(outro != null ? outro.getId() : null)
                    .outroUsuarioNome(outro != null ? outro.getNome() : null)
<<<<<<< HEAD
                    .outroUsuarioFotoPerfilUrl(outro != null ? outro.getFotoPerfilUrl() : null)
=======
                    .fotoPerfilUrl(outro != null ? outro.getFotoPerfilUrl() : null)
>>>>>>> origin/main
                    .titulo(outro != null ? outro.getNome() : "Conversa privada");
        } else {
            builder
                    .projetoId(conversa.getProjeto() != null ? conversa.getProjeto().getId() : null)
                    .projetoTitulo(conversa.getProjeto() != null ? conversa.getProjeto().getTitulo() : null)
                    .orientadorId(conversa.getProjeto() != null && conversa.getProjeto().getOrientador() != null
                            ? conversa.getProjeto().getOrientador().getUsuario().getId() : null)
                    .orientadorNome(conversa.getProjeto() != null && conversa.getProjeto().getOrientador() != null
                            ? conversa.getProjeto().getOrientador().getUsuario().getNome() : null)
                    .orientadorFotoPerfilUrl(conversa.getProjeto() != null && conversa.getProjeto().getOrientador() != null
                            ? conversa.getProjeto().getOrientador().getUsuario().getFotoPerfilUrl() : null)
                    .alunoCriadorId(conversa.getProjeto() != null && conversa.getProjeto().getAlunoCriador() != null
                            ? conversa.getProjeto().getAlunoCriador().getUsuario().getId() : null)
                    .alunoCriadorNome(conversa.getProjeto() != null && conversa.getProjeto().getAlunoCriador() != null
                            ? conversa.getProjeto().getAlunoCriador().getUsuario().getNome() : null)
<<<<<<< HEAD
                    .alunoCriadorFotoPerfilUrl(conversa.getProjeto() != null && conversa.getProjeto().getAlunoCriador() != null
                            ? conversa.getProjeto().getAlunoCriador().getUsuario().getFotoPerfilUrl() : null)
=======
                    .fotoPerfilUrl(conversa.getProjeto() != null && conversa.getProjeto().getFotoProjetoUrl() != null
                            ? conversa.getProjeto().getFotoProjetoUrl()
                            : conversa.getProjeto() != null && conversa.getProjeto().getOrientador() != null
                                    ? conversa.getProjeto().getOrientador().getUsuario().getFotoPerfilUrl()
                                    : null)
>>>>>>> origin/main
                    .titulo(conversa.getProjeto() != null ? conversa.getProjeto().getTitulo() : "Grupo");
        }

        return builder.build();
    }
}
