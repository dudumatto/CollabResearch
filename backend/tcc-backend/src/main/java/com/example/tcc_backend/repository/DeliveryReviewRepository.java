package com.example.tcc_backend.repository;

import com.example.tcc_backend.model.DeliveryReview;
import com.example.tcc_backend.dto.response.DeliveryReviewResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DeliveryReviewRepository extends JpaRepository<DeliveryReview, Long> {
    Optional<DeliveryReview> findByVersaoId(Long versaoId);
    @Query("""
            SELECT new com.example.tcc_backend.dto.response.DeliveryReviewResponse(
                r.id, v.id, reviewer.id, reviewer.nome, r.decisao, r.comentario, r.revisadaEm
            )
            FROM DeliveryReview r
            JOIN r.versao v
            JOIN r.revisor reviewer
            WHERE v.id IN :versaoIds
            """)
    List<DeliveryReviewResponse> findResponsesByVersaoIdIn(@Param("versaoIds") List<Long> versaoIds);
}
