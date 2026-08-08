package com.example.tcc_backend.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(
        name = "deadline_notification_log",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_deadline_notification",
                        columnNames = {"step_id", "user_id", "notification_kind", "reference_date"}
                )
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeadlineNotificationLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @ManyToOne
    @JoinColumn(name = "step_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private EtapaProgresso etapa;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Usuario usuario;

    @Enumerated(EnumType.STRING)
    @Column(name = "notification_kind", nullable = false, length = 20)
    private AlertaPrazo tipo;

    @Column(name = "reference_date", nullable = false)
    private LocalDate dataReferencia;

    @Column(name = "sent_at")
    private OffsetDateTime enviadaEm;

    @PrePersist
    public void prePersist() {
        if (this.enviadaEm == null) {
            this.enviadaEm = OffsetDateTime.now();
        }
    }
}
