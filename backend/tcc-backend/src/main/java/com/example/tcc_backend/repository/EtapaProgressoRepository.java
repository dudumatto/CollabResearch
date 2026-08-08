package com.example.tcc_backend.repository;

import com.example.tcc_backend.model.EtapaProgresso;
import com.example.tcc_backend.model.EtapaProgressoStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EtapaProgressoRepository extends JpaRepository<EtapaProgresso, Integer> {
    List<EtapaProgresso> findByProjetoIdOrderByOrdemAsc(Integer projetoId);
    List<EtapaProgresso> findByProjetoOrientadorUsuarioId(Integer usuarioId);
    List<EtapaProgresso> findByPrazoIsNotNull();
    Optional<EtapaProgresso> findByProjetoIdAndId(Integer projetoId, Integer id);
    long countByProjetoId(Integer projetoId);
    boolean existsByProjetoIdAndObrigatoriaTrueAndStatusNot(Integer projetoId, EtapaProgressoStatus status);
}
