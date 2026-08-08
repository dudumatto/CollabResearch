package com.example.tcc_backend.repository;

import com.example.tcc_backend.model.AcademicEvaluation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AcademicEvaluationRepository extends JpaRepository<AcademicEvaluation, Long> {
    List<AcademicEvaluation> findByProjetoOrientadorUsuarioId(Integer usuarioId);
    List<AcademicEvaluation> findByProjetoId(Integer projetoId);
    List<AcademicEvaluation> findByProjetoIdAndAlunoId(Integer projetoId, Integer alunoId);
    Optional<AcademicEvaluation> findByProjetoIdAndEtapaIdAndAlunoId(Integer projetoId, Integer etapaId, Integer alunoId);
    Optional<AcademicEvaluation> findByIdAndProjetoId(Long id, Integer projetoId);
}
