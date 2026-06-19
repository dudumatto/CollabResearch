package com.example.tcc_backend.dto.request;

import com.example.tcc_backend.model.TipoDocumento;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class DocumentoUploadRequest {

    @NotNull(message = "usuarioId obrigatorio")
    private Integer usuarioId;

    @NotNull(message = "Tipo do documento obrigatorio")
    private TipoDocumento tipo;

    @NotBlank(message = "nomeArquivo obrigatorio")
    @Size(max = 255, message = "nomeArquivo deve ter no maximo 255 caracteres")
    private String nomeArquivo;

    @NotBlank(message = "url obrigatoria")
    @Size(max = 1000, message = "url deve ter no maximo 1000 caracteres")
    private String url;
}
