package com.example.tcc_backend.repository;

import com.example.tcc_backend.model.ConfiguracaoSistema;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ConfiguracaoSistemaRepository extends JpaRepository<ConfiguracaoSistema, Integer> {
    Optional<ConfiguracaoSistema> findByChave(String chave);
}
