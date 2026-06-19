package com.example.tcc_backend.dto.response;

import com.example.tcc_backend.model.Documento;
import com.example.tcc_backend.model.StatusDocumento;
import com.example.tcc_backend.model.TipoDocumento;
import lombok.Builder;
import lombok.Data;

import java.nio.file.Path;
import java.time.LocalDateTime;

@Data
@Builder
public class DocumentoResponse {
    private Integer id;
    private Integer usuarioId;
    private String usuarioNome;
    private TipoDocumento tipo;
    private StatusDocumento status;
    private String observacaoStatus;
    private String nomeArquivo;
    private String url;
    private LocalDateTime dataEnvio;
    private String downloadUrl;
    private String previewUrl;

    public static DocumentoResponse fromEntity(Documento documento) {
        String nome = documento.getNomeArquivo();
        if (nome == null || nome.isBlank()) {
            nome = Path.of(documento.getCaminho()).getFileName().toString();
        }
        String url = documento.getCaminho() != null && documento.getCaminho().startsWith("http")
                ? documento.getCaminho()
                : null;
        return DocumentoResponse.builder()
                .id(documento.getId())
                .usuarioId(documento.getUsuario() == null ? null : documento.getUsuario().getId())
                .usuarioNome(documento.getUsuario() == null ? null : documento.getUsuario().getNome())
                .tipo(documento.getTipo())
                .status(documento.getStatus())
                .observacaoStatus(documento.getObservacaoStatus())
                .nomeArquivo(nome)
                .url(url)
                .dataEnvio(documento.getDataEnvio())
                .downloadUrl("/api/documentos/" + documento.getId() + "/download")
                .previewUrl("/api/documentos/" + documento.getId() + "/preview")
                .build();
    }
}
