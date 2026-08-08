package com.example.tcc_backend.repository;

import com.example.tcc_backend.model.AlertaPrazo;
import com.example.tcc_backend.model.DeadlineNotificationLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;

@Repository
public interface DeadlineNotificationLogRepository extends JpaRepository<DeadlineNotificationLog, Long> {
    boolean existsByEtapaIdAndUsuarioIdAndTipoAndDataReferencia(Long etapaId,
                                                                Integer usuarioId,
                                                                AlertaPrazo tipo,
                                                                LocalDate dataReferencia);
}
