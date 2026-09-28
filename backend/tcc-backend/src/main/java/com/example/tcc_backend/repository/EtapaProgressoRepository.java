package com.example.tcc_backend.repository;

import com.example.tcc_backend.model.EtapaProgresso;
import com.example.tcc_backend.model.EtapaProgressoStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface EtapaProgressoRepository extends JpaRepository<EtapaProgresso, Integer> {
    @Query("SELECT e FROM EtapaProgresso e JOIN FETCH e.projeto p LEFT JOIN FETCH e.concluidaPor WHERE p.id IN :projetoIds ORDER BY p.id, e.ordem")
    List<EtapaProgresso> findAllForCalendarioByProjetoIds(@Param("projetoIds") List<Integer> projetoIds);
    List<EtapaProgresso> findByProjetoIdOrderByOrdemAsc(Integer projetoId);
    List<EtapaProgresso> findByProjetoOrientadorUsuarioId(Integer usuarioId);
    List<EtapaProgresso> findByPrazoIsNotNull();
    Optional<EtapaProgresso> findByProjetoIdAndId(Integer projetoId, Integer id);
    long countByProjetoId(Integer projetoId);
    boolean existsByProjetoIdAndObrigatoriaTrueAndStatusNot(Integer projetoId, EtapaProgressoStatus status);
}
