package com.example.tcc_backend.repository;

import com.example.tcc_backend.model.LumenRecomendacao;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface LumenRecomendacaoRepository extends JpaRepository<LumenRecomendacao, Integer> {
    Optional<LumenRecomendacao> findFirstByAlunoIdOrderByDataCriacaoDescIdDesc(Integer alunoId);
}
