package com.example.tcc_backend.repository;

import com.example.tcc_backend.model.Progresso;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProgressoRepository extends JpaRepository <Progresso, Integer> {
    List<Progresso> findByProjetoIdOrderByDataRegistroDesc(Integer projetoId);
}
