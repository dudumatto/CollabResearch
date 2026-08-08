package com.example.tcc_backend.dto.request;

import com.example.tcc_backend.model.EntregaDecisao;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class DeliveryReviewRequest {

    @NotNull(message = "Decisao e obrigatoria")
    private EntregaDecisao decisao;

    @Size(max = 2000, message = "Comentario deve ter no maximo 2000 caracteres")
    private String comentario;
}
