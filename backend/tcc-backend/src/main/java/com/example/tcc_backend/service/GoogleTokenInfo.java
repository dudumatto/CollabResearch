package com.example.tcc_backend.service;

public record GoogleTokenInfo(
        String subject,
        String email,
        boolean emailVerified,
        String hostedDomain,
        String name,
        String pictureUrl
) {
}
