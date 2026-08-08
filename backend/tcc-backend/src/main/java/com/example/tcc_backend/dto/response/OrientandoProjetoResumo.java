package com.example.tcc_backend.dto.response;

import com.example.tcc_backend.model.StatusProjeto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrientandoProjetoResumo {

    private Integer projetoId;
    private String projetoTitulo;
    private StatusProjeto status;
}
