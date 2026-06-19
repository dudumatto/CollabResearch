package com.example.tcc_backend.dto.request;

import com.example.tcc_backend.model.StatusInscricao;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AdminInscricaoStatusRequest {
    @NotNull(message = "Status obrigatorio")
    private StatusInscricao status;

    @Size(max = 2000)
    private String parecer;
}
