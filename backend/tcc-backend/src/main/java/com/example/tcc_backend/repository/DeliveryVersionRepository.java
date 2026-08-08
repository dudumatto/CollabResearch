package com.example.tcc_backend.repository;

import com.example.tcc_backend.model.DeliveryVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DeliveryVersionRepository extends JpaRepository<DeliveryVersion, Long> {
    List<DeliveryVersion> findByEntregaIdOrderByNumeroVersaoAsc(Long entregaId);
    Optional<DeliveryVersion> findFirstByEntregaIdOrderByNumeroVersaoDesc(Long entregaId);
    List<DeliveryVersion> findByEntregaProjetoId(Integer projetoId);
}
