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
public class OrientandoDetalheResponse {

    private Integer alunoId;
    private Integer alunoUsuarioId;
    private String nome;
    private String email;
    private String fotoPerfilUrl;
    private String ra;
    private String curso;
    private Integer semestre;
    private String interesses;
    private OrientandoProjetoResumo projetoSelecionado;
    private List<OrientandoProjetoResumo> projetos;
    private Integer progresso;
    private List<OrientandoEtapaResponse> etapas;
    private List<OrientandoHistoricoResponse> historico;
}
