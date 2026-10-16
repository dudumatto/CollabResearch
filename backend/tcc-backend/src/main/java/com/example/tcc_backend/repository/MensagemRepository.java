package com.example.tcc_backend.repository;

import com.example.tcc_backend.model.Mensagem;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface MensagemRepository extends JpaRepository<Mensagem, Integer> {
    List<Mensagem> findByConversaIdOrderByDataEnvioAsc(Integer conversaId);
    Page<Mensagem> findByConversaId(Integer conversaId, Pageable pageable);
    Optional<Mensagem> findFirstByConversaIdOrderByDataEnvioDescIdDesc(Integer conversaId);
    List<Mensagem> findByConversaIdAndRemetenteIdNotAndDataLeituraIsNull(Integer conversaId, Integer remetenteId);

    // Última mensagem de cada conversa em uma única consulta (empates de horário resolvidos no serviço).
    @Query("""
            select m from Mensagem m
            where m.conversa.id in :conversaIds
              and m.dataEnvio = (select max(m2.dataEnvio) from Mensagem m2 where m2.conversa = m.conversa)
            """)
    List<Mensagem> findUltimasPorConversaIds(@Param("conversaIds") List<Integer> conversaIds);

    @Query("""
            select m.conversa.id, count(m) from Mensagem m
            where m.conversa.id in :conversaIds
              and m.dataLeitura is null
              and m.remetente.id <> :usuarioId
            group by m.conversa.id
            """)
    List<Object[]> contarNaoLidasPorConversaIds(@Param("conversaIds") List<Integer> conversaIds,
                                                @Param("usuarioId") Integer usuarioId);
}
