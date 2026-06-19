package com.example.tcc_backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AdvanceProgressStepRequest {

    @NotBlank(message = "Status e obrigatorio")
    private String status;
}
