package com.example.tcc_backend.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class OrdemRequest {

    @NotNull(message = "ids e obrigatorio")
    private List<Integer> ids;
}
