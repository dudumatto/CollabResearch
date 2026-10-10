package com.example.tcc_backend.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.LocalDateTime;

/** Historico imutavel de envios, aprovacoes e devolucoes de um marco. */
@Entity
@Table(name = "progress_step_reviews")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EtapaRevisao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "step_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private EtapaProgresso etapa;

    @Enumerated(EnumType.STRING)
    @Column(name = "action", nullable = false, length = 20)
    private RevisaoAcao acao;

    @Column(name = "comment", columnDefinition = "TEXT")
    private String comentario;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id")
    @OnDelete(action = OnDeleteAction.SET_NULL)
    private Usuario autor;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime criadoEm;

    @PrePersist
    public void prePersist() {
        if (criadoEm == null) {
            criadoEm = LocalDateTime.now();
        }
    }
}
