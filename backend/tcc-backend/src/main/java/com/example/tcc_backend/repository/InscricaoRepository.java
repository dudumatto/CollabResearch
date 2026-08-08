package com.example.tcc_backend.repository;

import com.example.tcc_backend.model.Inscricao;
import com.example.tcc_backend.model.StatusInscricao;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import jakarta.persistence.LockModeType;

import java.util.List;
import java.util.Optional;

@Repository
public interface InscricaoRepository extends JpaRepository<Inscricao, Integer> {
    List<Inscricao> findByAlunoId(Integer alunoId);
    @Query("SELECT i.projeto.id FROM Inscricao i WHERE i.id = :id")
    Optional<Integer> findProjetoIdById(@Param("id") Integer id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT i FROM Inscricao i WHERE i.id = :id")
    Optional<Inscricao> findByIdForUpdate(@Param("id") Integer id);

    List<Inscricao> findByAlunoUsuarioId(Integer usuarioId);
    Page<Inscricao> findByAlunoUsuarioId(Integer usuarioId, Pageable pageable);
    List<Inscricao> findByAlunoUsuarioIdAndStatus(Integer usuarioId, StatusInscricao status);
    List<Inscricao> findByProjetoId(Integer projetoId);
    Page<Inscricao> findByProjetoId(Integer projetoId, Pageable pageable);
    List<Inscricao> findByProjetoIdAndStatus(Integer projetoId, StatusInscricao status);
    Page<Inscricao> findByStatus(StatusInscricao status, Pageable pageable);
    long countByStatus(StatusInscricao status);
    long countByProjetoIdAndStatus(Integer projetoId, StatusInscricao status);
    Optional<Inscricao> findByProjetoIdAndAlunoUsuarioId(Integer projetoId, Integer usuarioId);
    boolean existsByProjetoIdAndAlunoUsuarioIdAndStatus(Integer projetoId, Integer usuarioId, StatusInscricao status);
    List<Inscricao> findByProjetoOrientadorUsuarioId(Integer usuarioId);
    Page<Inscricao> findByProjetoOrientadorUsuarioId(Integer usuarioId, Pageable pageable);
    long countByProjetoOrientadorUsuarioIdAndStatus(Integer usuarioId, StatusInscricao status);
    boolean existsByAlunoIdAndProjetoId(Integer alunoId, Integer projetoId);
}
