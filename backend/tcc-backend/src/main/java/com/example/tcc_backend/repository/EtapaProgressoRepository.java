package com.example.tcc_backend.repository;

import com.example.tcc_backend.model.EtapaProgresso;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EtapaProgressoRepository extends JpaRepository<EtapaProgresso, Integer> {
    List<EtapaProgresso> findByProjetoIdOrderByOrdemAsc(Integer projetoId);
    Optional<EtapaProgresso> findByProjetoIdAndId(Integer projetoId, Integer id);
    long countByProjetoId(Integer projetoId);
}
