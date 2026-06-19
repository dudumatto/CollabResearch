package com.example.tcc_backend.repository;

import com.example.tcc_backend.model.Notificacao;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificacaoRepository extends JpaRepository<Notificacao, Integer> {
    List<Notificacao> findByUsuarioIdOrderByDataCriacaoDesc(Integer usuarioId);
    Page<Notificacao> findByUsuarioIdOrderByDataCriacaoDesc(Integer usuarioId, Pageable pageable);
    long countByUsuarioIdAndLidaFalse(Integer usuarioId);
}
