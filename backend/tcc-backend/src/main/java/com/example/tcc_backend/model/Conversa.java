package com.example.tcc_backend.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "conversa")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Conversa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_conversa")
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "id_projeto", nullable = true)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Projeto projeto;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo", nullable = false)
    @Builder.Default
    private TipoConversa tipo = TipoConversa.GRUPO;

    @ManyToMany
    @JoinTable(
            name = "conversa_participantes",
            joinColumns = @JoinColumn(name = "id_conversa"),
            inverseJoinColumns = @JoinColumn(name = "id_usuario")
    )
    @Builder.Default
    private List<Usuario> participantes = new ArrayList<>();

    @OneToMany(mappedBy = "conversa", fetch = FetchType.LAZY)
    @OrderBy("dataEnvio DESC")
    @Builder.Default
    private List<Mensagem> mensagens = new ArrayList<>();

    @Column(name = "data_criacao")
    private OffsetDateTime dataCriacao;

    @PrePersist
    public void prePersist() {
        this.dataCriacao = OffsetDateTime.now();
    }
}