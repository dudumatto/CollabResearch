package com.example.tcc_backend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.LocalDateTime;

@Entity
@Table(name = "progresso")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Progresso {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_progresso")
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "id_projeto", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Projeto projeto;

    @ManyToOne
    @JoinColumn(name = "id_usuario_autor")
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Usuario autor;

    @Column(name = "titulo", length = 150)
    private String titulo;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo", nullable = false)
    private TipoProgresso tipo;

    @Column(name = "fase", length = 100)
    private String fase;

    @Column(name = "descricao", columnDefinition = "TEXT")
    private String descricao;

    @Column(name = "metadata_json", columnDefinition = "TEXT")
    private String metadataJson;

    @Column(name = "categoria", length = 30)
    private String categoria;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_etapa")
    @OnDelete(action = OnDeleteAction.SET_NULL)
    private EtapaProgresso etapa;

    @Column(name = "step_contribution")
    private Integer stepContribution;

    @Column(name = "data_registro")
    private LocalDateTime dataRegistro;

    @PrePersist
    public void prePersist() {
        this.dataRegistro = LocalDateTime.now();
        if (this.tipo == null) {
            this.tipo = TipoProgresso.ATUALIZACAO;
        }
    }
}
