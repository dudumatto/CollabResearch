package com.example.tcc_backend.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.OffsetDateTime;

@Entity
@Table(
        name = "delivery_versions",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_delivery_version", columnNames = {"delivery_id", "version_number"})
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeliveryVersion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @ManyToOne
    @JoinColumn(name = "delivery_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private ProjectDelivery entrega;

    @Column(name = "version_number", nullable = false)
    private Integer numeroVersao;

    @Column(name = "storage_path", nullable = false, length = 1000)
    private String caminhoArquivo;

    @Column(name = "file_name", nullable = false, length = 255)
    private String nomeArquivo;

    @Column(name = "content_type", length = 120)
    private String contentType;

    @Column(name = "size_bytes")
    private Long tamanhoBytes;

    @Column(name = "submitted_at")
    private OffsetDateTime enviadaEm;

    @PrePersist
    public void prePersist() {
        if (this.enviadaEm == null) {
            this.enviadaEm = OffsetDateTime.now();
        }
    }
}
