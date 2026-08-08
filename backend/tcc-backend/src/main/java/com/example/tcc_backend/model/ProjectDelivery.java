package com.example.tcc_backend.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.OffsetDateTime;

@Entity
@Table(name = "project_deliveries")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectDelivery {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @ManyToOne
    @JoinColumn(name = "project_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Projeto projeto;

    @ManyToOne
    @JoinColumn(name = "step_id")
    @OnDelete(action = OnDeleteAction.SET_NULL)
    private EtapaProgresso etapa;

    @ManyToOne
    @JoinColumn(name = "author_user_id", nullable = false)
    private Usuario autor;

    @Column(name = "title", nullable = false, length = 180)
    private String titulo;

    @Column(name = "category", nullable = false, length = 100)
    private String categoria;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private EntregaStatus status;

    @Column(name = "created_at")
    private OffsetDateTime criadaEm;

    @Column(name = "updated_at")
    private OffsetDateTime atualizadaEm;

    @PrePersist
    public void prePersist() {
        if (this.status == null) {
            this.status = EntregaStatus.PENDING_REVIEW;
        }
        if (this.criadaEm == null) {
            this.criadaEm = OffsetDateTime.now();
        }
        if (this.atualizadaEm == null) {
            this.atualizadaEm = OffsetDateTime.now();
        }
    }
}
