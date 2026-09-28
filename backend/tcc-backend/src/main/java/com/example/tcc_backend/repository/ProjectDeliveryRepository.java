package com.example.tcc_backend.repository;

import com.example.tcc_backend.model.ProjectDelivery;
import com.example.tcc_backend.model.EntregaStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectDeliveryRepository extends JpaRepository<ProjectDelivery, Long> {
    List<ProjectDelivery> findByProjetoOrientadorUsuarioId(Integer usuarioId);
    List<ProjectDelivery> findByProjetoId(Integer projetoId);

    @Query("""
            SELECT d FROM ProjectDelivery d
            JOIN FETCH d.projeto p
            LEFT JOIN FETCH d.etapa
            LEFT JOIN FETCH d.autor
            WHERE p.orientador.usuario.id = :orientadorId
              AND (:projetoId IS NULL OR p.id = :projetoId)
              AND (:status IS NULL OR d.status = :status)
            """)
    List<ProjectDelivery> findAdvisorDeliveries(
            @Param("orientadorId") Integer orientadorId,
            @Param("projetoId") Integer projetoId,
            @Param("status") EntregaStatus status);

    @Query("""
            SELECT d FROM ProjectDelivery d
            JOIN FETCH d.projeto
            LEFT JOIN FETCH d.etapa
            LEFT JOIN FETCH d.autor
            WHERE d.projeto.id = :projetoId
            """)
    List<ProjectDelivery> findWithRelationsByProjetoId(@Param("projetoId") Integer projetoId);
}
