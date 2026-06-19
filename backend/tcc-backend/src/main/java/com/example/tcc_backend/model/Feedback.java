package com.example.tcc_backend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import org.hibernate.annotations.Check;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "feedback",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_feedback_projeto_avaliador",
                        columnNames = {"id_projeto", "id_usuario_avaliador"}
                )
        }
)
@Check(constraints = "nota BETWEEN 1 AND 5")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Feedback {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_feedback")
    private Integer id;

    @Min(1)
    @Max(5)
    @Column(name = "nota", nullable = false)
    private Integer nota;

    @Column(name = "comentario", columnDefinition = "TEXT")
    private String comentario;

    @ManyToOne
    @JoinColumn(name = "id_projeto", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Projeto projeto;

    @ManyToOne
    @JoinColumn(name = "id_usuario_avaliador", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Usuario avaliador;

    @Column(name = "data_feedback")
    private LocalDateTime dataFeedback;

    @PrePersist
    public void prePersist() {
        this.dataFeedback = LocalDateTime.now();
    }
}
