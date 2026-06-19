package com.example.tcc_backend.repository;

import com.example.tcc_backend.model.AreaPesquisa;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AreaPesquisaRepository extends JpaRepository<AreaPesquisa, Integer> {
    boolean existsByNomeIgnoreCase(String nome);
}
