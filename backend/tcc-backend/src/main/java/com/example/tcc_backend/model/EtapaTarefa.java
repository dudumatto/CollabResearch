package com.example.tcc_backend.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.LocalDateTime;

/** Item de checklist de um marco ({@link EtapaProgresso}). */
@Entity
@Table(name = "progress_step_tasks")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EtapaTarefa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "step_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private EtapaProgresso etapa;

    @Column(name = "title", nullable = false, length = 200)
    private String titulo;

    @Column(name = "required", nullable = false)
    @Builder.Default
    private Boolean obrigatoria = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "origin", nullable = false, length = 20)
    private TarefaOrigem origem;

    @Column(name = "completed", nullable = false)
    @Builder.Default
    private Boolean concluida = false;

    @Column(name = "completed_at")
    private LocalDateTime concluidaEm;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "completed_by")
    @OnDelete(action = OnDeleteAction.SET_NULL)
    private Usuario concluidaPor;

    @Column(name = "task_order", nullable = false)
    private Integer ordem;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    @OnDelete(action = OnDeleteAction.SET_NULL)
    private Usuario criadaPor;

    @Column(name = "created_at")
    private LocalDateTime criadaEm;

    @PrePersist
    public void prePersist() {
        if (criadaEm == null) {
            criadaEm = LocalDateTime.now();
        }
        if (obrigatoria == null) {
            obrigatoria = false;
        }
        if (concluida == null) {
            concluida = false;
        }
    }
}
