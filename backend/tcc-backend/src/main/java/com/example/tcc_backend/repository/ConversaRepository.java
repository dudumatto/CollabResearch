package com.example.tcc_backend.repository;

import com.example.tcc_backend.model.Conversa;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ConversaRepository extends JpaRepository<Conversa, Integer> {

    List<Conversa> findByProjetoIdIn(List<Integer> projetoIds);

    List<Conversa> findByProjetoOrientadorUsuarioIdOrProjetoAlunoCriadorUsuarioId(
            Integer orientadorUsuarioId, Integer alunoCriadorUsuarioId);

    Page<Conversa> findByProjetoOrientadorUsuarioIdOrProjetoAlunoCriadorUsuarioId(
            Integer orientadorUsuarioId, Integer alunoCriadorUsuarioId, Pageable pageable);

    Optional<Conversa> findByProjetoId(Integer projetoId);

    @Query("""
        SELECT c FROM Conversa c
        JOIN c.participantes p1
        JOIN c.participantes p2
        WHERE c.tipo = 'PRIVADA'
          AND p1.id = :usuarioAId
          AND p2.id = :usuarioBId
    """)
    Optional<Conversa> findPrivadaEntreUsuarios(
            @Param("usuarioAId") Integer usuarioAId,
            @Param("usuarioBId") Integer usuarioBId);

    @Query("""
        SELECT c FROM Conversa c
        JOIN c.participantes p
        WHERE c.tipo = 'PRIVADA'
          AND p.id = :usuarioId
    """)
    List<Conversa> findPrivadasDoUsuario(@Param("usuarioId") Integer usuarioId);
}