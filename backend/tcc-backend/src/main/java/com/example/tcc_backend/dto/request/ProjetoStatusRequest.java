package com.example.tcc_backend.dto.request;

import com.example.tcc_backend.model.StatusProjeto;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ProjetoStatusRequest {
    @NotNull(message = "Status obrigatorio")
    private StatusProjeto status;
}
