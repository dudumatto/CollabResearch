package com.example.tcc_backend.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;

@Entity
@Table(name = "progress_steps")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EtapaProgresso {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Projeto projeto;

    @Column(name = "title", nullable = false, length = 120)
    private String titulo;

    @Column(name = "description", columnDefinition = "TEXT")
    private String descricao;

    @Column(name = "weight", nullable = false)
    private Integer peso;

    @Column(name = "step_order", nullable = false)
    private Integer ordem;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private EtapaProgressoStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "responsible", nullable = false, length = 20)
    @Builder.Default
    private EtapaResponsavel responsavel = EtapaResponsavel.AMBOS;

    @Column(name = "due_at")
    private OffsetDateTime prazo;

    @Column(name = "completed_at")
    private LocalDateTime concluidaEm;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "completed_by")
    @OnDelete(action = OnDeleteAction.SET_NULL)
    private Usuario concluidaPor;

    @Column(name = "required", nullable = false)
    private Boolean obrigatoria;

    @Column(name = "created_at")
    private LocalDateTime criadaEm;

    @PrePersist
    public void prePersist() {
        if (this.criadaEm == null) {
            this.criadaEm = LocalDateTime.now();
        }
        if (this.obrigatoria == null) {
            this.obrigatoria = true;
        }
        if (this.status == null) {
            this.status = EtapaProgressoStatus.PENDING;
        }
        if (this.responsavel == null) {
            this.responsavel = EtapaResponsavel.AMBOS;
        }
    }
}
