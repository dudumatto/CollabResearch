package com.example.tcc_backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrientandoHistoricoResponse {

    private Integer id;
    private String titulo;
    private String descricao;
    private String categoria;
    private LocalDateTime dataRegistro;
}
