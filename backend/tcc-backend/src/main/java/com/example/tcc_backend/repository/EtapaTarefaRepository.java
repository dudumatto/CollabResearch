package com.example.tcc_backend.repository;

import com.example.tcc_backend.model.EtapaTarefa;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface EtapaTarefaRepository extends JpaRepository<EtapaTarefa, Integer> {
    @EntityGraph(attributePaths = "criadaPor")
    List<EtapaTarefa> findByEtapaIdInOrderByOrdemAscIdAsc(Collection<Integer> etapaIds);
    @EntityGraph(attributePaths = "criadaPor")
    List<EtapaTarefa> findByEtapaIdOrderByOrdemAscIdAsc(Integer etapaId);
    List<EtapaTarefa> findByEtapaProjetoIdIn(Collection<Integer> projetoIds);
    List<EtapaTarefa> findByEtapaProjetoOrientadorUsuarioId(Integer usuarioId);
    Optional<EtapaTarefa> findByIdAndEtapaId(Integer id, Integer etapaId);
}
