package com.example.tcc_backend.repository;

import com.example.tcc_backend.model.Projeto;
import com.example.tcc_backend.model.StatusProjeto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjetoRepository extends JpaRepository<Projeto, Integer>, JpaSpecificationExecutor<Projeto> {
    List<Projeto> findByStatus(StatusProjeto status);
    Page<Projeto> findByStatus(StatusProjeto status, Pageable pageable);
    long countByStatus(StatusProjeto status);
    List<Projeto> findByAreaId(Integer areaId);
    Page<Projeto> findByAreaId(Integer areaId, Pageable pageable);
    List<Projeto> findByAreaNomeContainingIgnoreCase(String area);
    Page<Projeto> findByAreaNomeContainingIgnoreCase(String area, Pageable pageable);
    List<Projeto> findByAreaCursoNomeContainingIgnoreCase(String curso);
    Page<Projeto> findByAreaCursoNomeContainingIgnoreCase(String curso, Pageable pageable);
    List<Projeto> findByTituloContainingIgnoreCase(String busca);
    Page<Projeto> findByTituloContainingIgnoreCase(String busca, Pageable pageable);
    List<Projeto> findByOrientadorUsuarioIdOrAlunoCriadorUsuarioId(Integer orientadorUsuarioId, Integer alunoCriadorUsuarioId);
    Page<Projeto> findByOrientadorUsuarioIdOrAlunoCriadorUsuarioId(Integer orientadorUsuarioId, Integer alunoCriadorUsuarioId, Pageable pageable);
    @Query("""
    SELECT p FROM Projeto p
    WHERE p.orientador.usuario.id = :usuarioId
       OR p.alunoCriador.usuario.id = :usuarioId
""")
    List<Projeto> buscarPorUsuario(@Param("usuarioId") Integer usuarioId);

    @Query("""
    SELECT DISTINCT p FROM Projeto p
    LEFT JOIN Inscricao i ON i.projeto = p
    WHERE p.orientador.usuario.id = :usuarioId
       OR p.alunoCriador.usuario.id = :usuarioId
       OR i.aluno.usuario.id = :usuarioId
""")
    List<Projeto> findRelacionadosAoUsuario(@Param("usuarioId") Integer usuarioId);

    @Query(value = """
    SELECT DISTINCT p FROM Projeto p
    LEFT JOIN Inscricao i ON i.projeto = p
    WHERE p.orientador.usuario.id = :usuarioId
       OR p.alunoCriador.usuario.id = :usuarioId
       OR i.aluno.usuario.id = :usuarioId
""", countQuery = """
    SELECT COUNT(DISTINCT p) FROM Projeto p
    LEFT JOIN Inscricao i ON i.projeto = p
    WHERE p.orientador.usuario.id = :usuarioId
       OR p.alunoCriador.usuario.id = :usuarioId
       OR i.aluno.usuario.id = :usuarioId
""")
    Page<Projeto> findRelacionadosAoUsuario(@Param("usuarioId") Integer usuarioId, Pageable pageable);

}
