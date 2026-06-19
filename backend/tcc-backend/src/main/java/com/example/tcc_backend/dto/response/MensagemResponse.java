package com.example.tcc_backend.dto.response;

import com.example.tcc_backend.model.Mensagem;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MensagemResponse {

    private Integer id;
    private Integer conversaId;
    private String conteudo;
    private OffsetDateTime dataEnvio;
    private Integer remetenteId;
    private String remetenteNome;
    private Boolean editada;
    private OffsetDateTime dataEdicao;

    public static MensagemResponse fromEntity(Mensagem mensagem) {
        return MensagemResponse.builder()
                .id(mensagem.getId())
                .conversaId(mensagem.getConversa() != null ? mensagem.getConversa().getId() : null)
                .conteudo(mensagem.getConteudo())
                .dataEnvio(mensagem.getDataEnvio())
                .remetenteId(mensagem.getRemetente() != null ? mensagem.getRemetente().getId() : null)
                .remetenteNome(mensagem.getRemetente() != null ? mensagem.getRemetente().getNome() : null)
                .editada(mensagem.getEditada())
                .dataEdicao(mensagem.getDataEdicao())
                .build();
    }
}