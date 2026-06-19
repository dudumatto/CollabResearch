package com.example.tcc_backend.dto.response;

import com.example.tcc_backend.model.ConfiguracaoSistema;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ConfiguracaoResponse {
    private String chave;
    private String valor;
    private String descricao;
    private LocalDateTime atualizadoEm;

    public static ConfiguracaoResponse fromEntity(ConfiguracaoSistema configuracao) {
        return ConfiguracaoResponse.builder()
                .chave(configuracao.getChave())
                .valor(configuracao.getValor())
                .descricao(configuracao.getDescricao())
                .atualizadoEm(configuracao.getAtualizadoEm())
                .build();
    }
}
