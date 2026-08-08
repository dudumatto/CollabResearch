package com.example.tcc_backend.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "academic_evaluations")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AcademicEvaluation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @ManyToOne
    @JoinColumn(name = "project_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Projeto projeto;

    @ManyToOne
    @JoinColumn(name = "step_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private EtapaProgresso etapa;

    @ManyToOne
    @JoinColumn(name = "student_id", nullable = false)
    private Aluno aluno;

    @ManyToOne
    @JoinColumn(name = "advisor_id", nullable = false)
    private Orientador orientador;

    @Column(name = "participation", nullable = false)
    private Integer participacao;

    @Column(name = "technical_quality", nullable = false)
    private Integer qualidadeTecnica;

    @Column(name = "deadline_compliance", nullable = false)
    private Integer cumprimentoDePrazos;

    @Column(name = "communication", nullable = false)
    private Integer comunicacao;

    @Column(name = "advisor_comment", nullable = false, length = 2000)
    private String comentarioOrientador;

    @Column(name = "average_score", nullable = false, precision = 3, scale = 2)
    private BigDecimal media;

    @Column(name = "created_at")
    private OffsetDateTime criadaEm;

    @Column(name = "updated_at")
    private OffsetDateTime atualizadaEm;

    @PrePersist
    public void prePersist() {
        if (this.criadaEm == null) {
            this.criadaEm = OffsetDateTime.now();
        }
        if (this.atualizadaEm == null) {
            this.atualizadaEm = OffsetDateTime.now();
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.atualizadaEm = OffsetDateTime.now();
    }
}
