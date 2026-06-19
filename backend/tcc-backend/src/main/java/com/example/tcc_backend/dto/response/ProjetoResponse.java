package com.example.tcc_backend.dto.response;

import com.example.tcc_backend.model.Projeto;
import com.example.tcc_backend.model.StatusProjeto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjetoResponse {

    private Integer id;
    private String titulo;
    private String descricao;
    private String requisitos;
    private String tecnologias;
    private Integer vagas;
    private StatusProjeto status;
    private LocalDateTime dataCriacao;
    private LocalDate dataInicio;
    private LocalDate dataFim;
    private LocalDate dataLimiteInscricao;
    private Integer areaId;
    private String areaNome;
    private String cursoNome;
    private Integer orientadorId;
    private String orientadorNome;
    private Integer alunoCriadorId;
    private String alunoCriadorNome;

    public static ProjetoResponse fromEntity(Projeto projeto) {
        return ProjetoResponse.builder()
                .id(projeto.getId())
                .titulo(projeto.getTitulo())
                .descricao(projeto.getDescricao())
                .requisitos(projeto.getRequisitos())
                .tecnologias(projeto.getTecnologias())
                .vagas(projeto.getVagas())
                .status(projeto.getStatus())
                .dataCriacao(projeto.getDataCriacao())
                .dataInicio(projeto.getDataInicio())
                .dataFim(projeto.getDataFim())
                .dataLimiteInscricao(projeto.getDataLimiteInscricao())
                .areaId(projeto.getArea() != null ? projeto.getArea().getId() : null)
                .areaNome(projeto.getArea() != null ? projeto.getArea().getNome() : null)
                .cursoNome(projeto.getArea() != null && projeto.getArea().getCurso() != null ? projeto.getArea().getCurso().getNome() : null)
                .orientadorId(projeto.getOrientador() != null ? projeto.getOrientador().getUsuario().getId() : null)
                .orientadorNome(projeto.getOrientador() != null ? projeto.getOrientador().getUsuario().getNome() : null)
                .alunoCriadorId(projeto.getAlunoCriador() != null ? projeto.getAlunoCriador().getUsuario().getId() : null)
                .alunoCriadorNome(projeto.getAlunoCriador() != null ? projeto.getAlunoCriador().getUsuario().getNome() : null)
                .build();
    }
}
