package com.example.tcc_backend.repository;

import com.example.tcc_backend.model.Inscricao;
import com.example.tcc_backend.model.StatusInscricao;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InscricaoRepository extends JpaRepository<Inscricao, Integer> {
    List<Inscricao> findByAlunoId(Integer alunoId);
    List<Inscricao> findByAlunoUsuarioId(Integer usuarioId);
    List<Inscricao> findByAlunoUsuarioIdAndStatus(Integer usuarioId, StatusInscricao status);
    List<Inscricao> findByProjetoId(Integer projetoId);
    Page<Inscricao> findByProjetoId(Integer projetoId, Pageable pageable);
    List<Inscricao> findByProjetoIdAndStatus(Integer projetoId, StatusInscricao status);
    Page<Inscricao> findByStatus(StatusInscricao status, Pageable pageable);
    long countByStatus(StatusInscricao status);
    Optional<Inscricao> findByProjetoIdAndAlunoUsuarioId(Integer projetoId, Integer usuarioId);
    List<Inscricao> findByProjetoOrientadorUsuarioId(Integer usuarioId);
    long countByProjetoOrientadorUsuarioIdAndStatus(Integer usuarioId, StatusInscricao status);
    boolean existsByAlunoIdAndProjetoId(Integer alunoId, Integer projetoId);
}
