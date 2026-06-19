package com.example.tcc_backend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

@Entity
@Table(name = "orientador")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Orientador {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_orientador")
    private Integer id;

    @OneToOne
    @JoinColumn(name = "id_usuario", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Usuario usuario;

    @NotBlank
    @Column(name = "departamento", nullable = false, length = 100)
    private String departamento;

    @NotBlank
    @Column(name = "titulacao", nullable = false, length = 50)
    private String titulacao;
}
