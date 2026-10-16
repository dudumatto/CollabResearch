package com.example.tcc_backend.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.LocalDateTime;

/** Resultado de uma analise Lumen do aluno (JSON de LumenRecomendacaoResponse), mantido como historico. */
@Entity
@Table(name = "lumen_recomendacao")
@Getter
@Setter
@NoArgsConstructor
public class LumenRecomendacao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_lumen_recomendacao")
    private Integer id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "id_aluno", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Aluno aluno;

    @Column(name = "resultado", nullable = false, columnDefinition = "TEXT")
    private String resultado;

    @Column(name = "data_criacao", nullable = false)
    private LocalDateTime dataCriacao;

    @PrePersist
    void prePersist() {
        this.dataCriacao = LocalDateTime.now();
    }
}
