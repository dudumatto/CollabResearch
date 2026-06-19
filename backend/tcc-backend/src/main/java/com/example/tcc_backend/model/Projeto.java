package com.example.tcc_backend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "projeto")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Projeto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_projeto")
    private Integer id;

    @NotBlank
    @Column(name = "titulo", nullable = false, length = 150)
    private String titulo;

    @Column(name = "descricao", columnDefinition = "TEXT")
    private String descricao;

    @Column(name = "requisitos", columnDefinition = "TEXT")
    private String requisitos;

    @Column(name = "tecnologias", columnDefinition = "TEXT")
    private String tecnologias;

    @Column(name = "vagas")
    private Integer vagas;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private StatusProjeto status;

    @Column(name = "data_criacao")
    private LocalDateTime dataCriacao;

    @Column(name = "data_inicio")
    private LocalDate dataInicio;

    @Column(name = "data_fim")
    private LocalDate dataFim;

    @Column(name = "data_limite_inscricao")
    private LocalDate dataLimiteInscricao;

    @ManyToOne
    @JoinColumn(name = "id_area")
    private AreaPesquisa area;

    @ManyToOne
    @JoinColumn(name = "id_orientador")
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Orientador orientador;

    @ManyToOne
    @JoinColumn(name = "id_aluno_criador")
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Aluno alunoCriador;

    @PrePersist
    public void prePersist() {
        this.dataCriacao = LocalDateTime.now();
        if (this.status == null) {
            this.status = StatusProjeto.ABERTO;
        }
    }
}
