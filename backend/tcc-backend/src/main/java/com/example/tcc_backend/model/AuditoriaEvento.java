package com.example.tcc_backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "auditoria_evento")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditoriaEvento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_auditoria")
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "id_admin", nullable = false)
    private Usuario admin;

    @Column(name = "acao", nullable = false, length = 60)
    private String acao;

    @Column(name = "recurso", nullable = false, length = 60)
    private String recurso;

    @Column(name = "id_recurso")
    private Integer recursoId;

    @Column(name = "descricao", length = 300)
    private String descricao;

    @Column(name = "data_evento", nullable = false)
    private LocalDateTime dataEvento;

    @PrePersist
    public void prePersist() {
        if (dataEvento == null) {
            dataEvento = LocalDateTime.now();
        }
    }
}
