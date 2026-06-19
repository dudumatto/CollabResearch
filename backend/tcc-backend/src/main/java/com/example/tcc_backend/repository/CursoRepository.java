package com.example.tcc_backend.repository;

import com.example.tcc_backend.model.Curso;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CursoRepository extends JpaRepository<Curso, Integer> {
}
