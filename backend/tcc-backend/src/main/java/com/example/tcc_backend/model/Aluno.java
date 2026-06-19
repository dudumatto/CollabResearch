package com.example.tcc_backend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

@Entity
@Table(name = "aluno")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Aluno {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_aluno")
    private Integer id;

    @OneToOne
    @JoinColumn(name = "id_usuario", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Usuario usuario;

    @NotBlank
    @Column(name = "ra", nullable = false, unique = true, length = 20)
    private String ra;

    @Column(name = "semestre")
    private Integer semestre;

    @Column(name = "interesses", columnDefinition = "TEXT")
    private String interesses;

    @ManyToOne
    @JoinColumn(name = "id_curso")
    private Curso curso;
}
