package com.example.tcc_backend.repository;

import com.example.tcc_backend.model.AcademicEvaluationAcknowledgement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AcademicEvaluationAcknowledgementRepository extends JpaRepository<AcademicEvaluationAcknowledgement, Long> {
    boolean existsByAvaliacaoId(Long avaliacaoId);
    Optional<AcademicEvaluationAcknowledgement> findByAvaliacaoId(Long avaliacaoId);
}
