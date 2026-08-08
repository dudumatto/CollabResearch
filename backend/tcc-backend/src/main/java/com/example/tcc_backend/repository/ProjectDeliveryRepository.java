package com.example.tcc_backend.repository;

import com.example.tcc_backend.model.ProjectDelivery;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectDeliveryRepository extends JpaRepository<ProjectDelivery, Long> {
    List<ProjectDelivery> findByProjetoOrientadorUsuarioId(Integer usuarioId);
    List<ProjectDelivery> findByProjetoId(Integer projetoId);
}
