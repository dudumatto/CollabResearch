package com.example.tcc_backend.repository;

import com.example.tcc_backend.model.EtapaRevisao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface EtapaRevisaoRepository extends JpaRepository<EtapaRevisao, Integer> {

    @Query("SELECT r FROM EtapaRevisao r LEFT JOIN FETCH r.autor WHERE r.etapa.id = :etapaId ORDER BY r.criadoEm DESC, r.id DESC")
    List<EtapaRevisao> findHistorico(@Param("etapaId") Integer etapaId);

    @Query("SELECT r FROM EtapaRevisao r LEFT JOIN FETCH r.autor WHERE r.etapa.id IN :etapaIds ORDER BY r.criadoEm DESC, r.id DESC")
    List<EtapaRevisao> findHistoricoDasEtapas(@Param("etapaIds") Collection<Integer> etapaIds);
}
