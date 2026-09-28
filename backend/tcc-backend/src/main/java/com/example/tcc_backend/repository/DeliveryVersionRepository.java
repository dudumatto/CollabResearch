package com.example.tcc_backend.repository;

import com.example.tcc_backend.model.DeliveryVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DeliveryVersionRepository extends JpaRepository<DeliveryVersion, Long> {
    interface Summary {
        Long getEntregaId();
        Long getUltimaVersaoId();
        Long getTotalVersoes();
    }

    @Query("""
            SELECT v.entrega.id AS entregaId,
                   v.id AS ultimaVersaoId,
                   (SELECT COUNT(v2.id) FROM DeliveryVersion v2 WHERE v2.entrega.id = v.entrega.id) AS totalVersoes
            FROM DeliveryVersion v
            WHERE v.entrega.id IN :entregaIds
              AND v.numeroVersao = (
                  SELECT MAX(v3.numeroVersao) FROM DeliveryVersion v3 WHERE v3.entrega.id = v.entrega.id
              )
            """)
    List<Summary> findSummariesByEntregaIds(@Param("entregaIds") List<Long> entregaIds);

    List<DeliveryVersion> findByEntregaIdOrderByNumeroVersaoAsc(Long entregaId);
    Optional<DeliveryVersion> findFirstByEntregaIdOrderByNumeroVersaoDesc(Long entregaId);
    List<DeliveryVersion> findByEntregaProjetoId(Integer projetoId);
}
