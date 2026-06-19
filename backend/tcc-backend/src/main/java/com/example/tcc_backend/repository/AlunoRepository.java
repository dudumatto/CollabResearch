package com.example.tcc_backend.repository;

import com.example.tcc_backend.model.Aluno;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AlunoRepository extends JpaRepository<Aluno, Integer> {
    Optional<Aluno> findByUsuarioId(Integer usuarioId);
}