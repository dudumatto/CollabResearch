package com.example.tcc_backend.repository;

import com.example.tcc_backend.model.Feedback;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FeedbackRepository extends JpaRepository<Feedback, Integer> {
    List<Feedback> findByProjetoId(Integer projetoId);
    Page<Feedback> findByProjetoId(Integer projetoId, Pageable pageable);
    List<Feedback> findByProjetoOrientadorUsuarioIdOrProjetoAlunoCriadorUsuarioId(Integer orientadorUsuarioId, Integer alunoCriadorUsuarioId);
    Page<Feedback> findByProjetoOrientadorUsuarioIdOrProjetoAlunoCriadorUsuarioId(Integer orientadorUsuarioId, Integer alunoCriadorUsuarioId, Pageable pageable);
    boolean existsByProjetoIdAndAvaliadorId(Integer projetoId, Integer avaliadorId);
}
