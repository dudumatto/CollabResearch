package com.example.tcc_backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "configuracao_sistema", uniqueConstraints = @UniqueConstraint(columnNames = "chave"))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConfiguracaoSistema {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_configuracao")
    private Integer id;

    @Column(name = "chave", nullable = false, length = 80)
    private String chave;

    @Column(name = "valor", nullable = false, length = 500)
    private String valor;

    @Column(name = "descricao", length = 200)
    private String descricao;

    @Column(name = "atualizado_em", nullable = false)
    private LocalDateTime atualizadoEm;

    @PrePersist
    @PreUpdate
    public void touch() {
        atualizadoEm = LocalDateTime.now();
    }
}
