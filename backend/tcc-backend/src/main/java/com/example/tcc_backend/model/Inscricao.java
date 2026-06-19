package com.example.tcc_backend.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "inscricao",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_inscricao_aluno_projeto",
                        columnNames = {"id_aluno", "id_projeto"}
                )
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Inscricao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_inscricao")
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "id_aluno", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Aluno aluno;

    @ManyToOne
    @JoinColumn(name = "id_projeto", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Projeto projeto;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private StatusInscricao status;

    @Column(name = "motivacao", columnDefinition = "TEXT")
    private String motivacao;

    @Column(name = "parecer_orientador", columnDefinition = "TEXT")
    private String parecerOrientador;

    @Column(name = "data_inscricao")
    private LocalDateTime dataInscricao;

    @PrePersist
    public void prePersist() {
        this.dataInscricao = LocalDateTime.now();
        this.status = StatusInscricao.PENDENTE;
    }
}
