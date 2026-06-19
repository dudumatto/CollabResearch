package com.example.tcc_backend.repository;

import com.example.tcc_backend.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Integer>, JpaSpecificationExecutor<Usuario> {
    Optional<Usuario> findByEmail(String email);
    List<Usuario> findByTipoAndAtivoTrueOrderByNomeAsc(com.example.tcc_backend.model.TipoUsuario tipo);
    boolean existsByEmail(String email);
    long countByTipo(com.example.tcc_backend.model.TipoUsuario tipo);
    long countByAtivoTrue();
}
