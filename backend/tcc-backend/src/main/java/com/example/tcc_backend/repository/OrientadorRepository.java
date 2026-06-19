package com.example.tcc_backend.repository;

import com.example.tcc_backend.model.Orientador;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OrientadorRepository extends JpaRepository<Orientador, Integer> {
    Optional<Orientador> findByUsuarioId(Integer usuarioId);
}