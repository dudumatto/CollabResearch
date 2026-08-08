package com.example.tcc_backend.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.OffsetDateTime;

@Entity
@Table(name = "delivery_reviews")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeliveryReview {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @OneToOne
    @JoinColumn(name = "delivery_version_id", nullable = false, unique = true)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private DeliveryVersion versao;

    @ManyToOne
    @JoinColumn(name = "reviewer_user_id", nullable = false)
    private Usuario revisor;

    @Enumerated(EnumType.STRING)
    @Column(name = "decision", nullable = false, length = 30)
    private EntregaDecisao decisao;

    @Column(name = "comment", length = 2000)
    private String comentario;

    @Column(name = "reviewed_at")
    private OffsetDateTime revisadaEm;

    @PrePersist
    public void prePersist() {
        if (this.revisadaEm == null) {
            this.revisadaEm = OffsetDateTime.now();
        }
    }
}
