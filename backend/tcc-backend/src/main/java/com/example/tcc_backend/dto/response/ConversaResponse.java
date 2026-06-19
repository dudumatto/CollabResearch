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
    private Integer alunoCriadorId;
    private String alunoCriadorNome;

    // Campos de privada (nullable para grupos)
    private Integer outroUsuarioId;
    private String outroUsuarioNome;

    // Nome a exibir na lista
    private String titulo;

    // Última mensagem
    private String ultimaMensagem;
    private OffsetDateTime ultimaMensagemHorario;

    public static ConversaResponse fromEntity(Conversa conversa, Integer usuarioLogadoId) {
        ConversaResponseBuilder builder = ConversaResponse.builder()
                .id(conversa.getId())
                .dataCriacao(conversa.getDataCriacao())
                .tipo(conversa.getTipo().name());

        // Última mensagem (lista já vem ordenada DESC pelo @OrderBy)
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
                    .titulo(outro != null ? outro.getNome() : "Conversa privada");
        } else {
            builder
                    .projetoId(conversa.getProjeto() != null ? conversa.getProjeto().getId() : null)
                    .projetoTitulo(conversa.getProjeto() != null ? conversa.getProjeto().getTitulo() : null)
                    .orientadorId(conversa.getProjeto() != null && conversa.getProjeto().getOrientador() != null
                            ? conversa.getProjeto().getOrientador().getUsuario().getId() : null)
                    .orientadorNome(conversa.getProjeto() != null && conversa.getProjeto().getOrientador() != null
                            ? conversa.getProjeto().getOrientador().getUsuario().getNome() : null)
                    .alunoCriadorId(conversa.getProjeto() != null && conversa.getProjeto().getAlunoCriador() != null
                            ? conversa.getProjeto().getAlunoCriador().getUsuario().getId() : null)
                    .alunoCriadorNome(conversa.getProjeto() != null && conversa.getProjeto().getAlunoCriador() != null
                            ? conversa.getProjeto().getAlunoCriador().getUsuario().getNome() : null)
                    .titulo(conversa.getProjeto() != null ? conversa.getProjeto().getTitulo() : "Grupo");
        }

        return builder.build();
    }
}