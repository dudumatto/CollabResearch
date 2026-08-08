package com.example.tcc_backend.repository;

import com.example.tcc_backend.model.DeliveryReview;
import com.example.tcc_backend.model.DeliveryVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DeliveryReviewRepository extends JpaRepository<DeliveryReview, Long> {
    Optional<DeliveryReview> findByVersaoId(Long versaoId);
}
