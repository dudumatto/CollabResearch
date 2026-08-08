package com.example.tcc_backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrientandoResponse {

    private Integer alunoId;
    private Integer alunoUsuarioId;
    private String nome;
    private String email;
    private String ra;
    private String curso;
    private String situacao;
    private Integer progresso;
    private Long pendencias;
    private List<OrientandoProjetoResumo> projetos;
}
