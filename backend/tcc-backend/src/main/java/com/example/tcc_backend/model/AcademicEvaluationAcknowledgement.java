package com.example.tcc_backend.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.OffsetDateTime;

@Entity
@Table(name = "academic_evaluation_acknowledgements")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AcademicEvaluationAcknowledgement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @OneToOne
    @JoinColumn(name = "evaluation_id", nullable = false, unique = true)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private AcademicEvaluation avaliacao;

    @ManyToOne
    @JoinColumn(name = "student_user_id", nullable = false)
    private Usuario aluno;

    @Column(name = "student_comment", length = 2000)
    private String comentarioAluno;

    @Column(name = "acknowledged_at")
    private OffsetDateTime dataCiencia;

    @PrePersist
    public void prePersist() {
        if (this.dataCiencia == null) {
            this.dataCiencia = OffsetDateTime.now();
        }
    }
}
