package com.example.tcc_backend.repository;

import com.example.tcc_backend.model.Mensagem;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MensagemRepository extends JpaRepository<Mensagem, Integer> {
    List<Mensagem> findByConversaIdOrderByDataEnvioAsc(Integer conversaId);
    Page<Mensagem> findByConversaIdOrderByDataEnvioAsc(Integer conversaId, Pageable pageable);
}
