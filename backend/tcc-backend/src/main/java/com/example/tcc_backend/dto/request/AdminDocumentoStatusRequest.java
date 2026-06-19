package com.example.tcc_backend.dto.request;

import com.example.tcc_backend.model.StatusDocumento;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AdminDocumentoStatusRequest {
    @NotNull(message = "Status obrigatorio")
    private StatusDocumento status;

    @Size(max = 1000)
    private String observacao;
}
