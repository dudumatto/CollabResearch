package com.example.tcc_backend.service;

import com.example.tcc_backend.model.Usuario;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Date;
import java.util.UUID;

@Service
public class JwtService {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration-ms:2592000000}")
    private long expirationMs;

    @PostConstruct
    void validateConfiguration() {
        try {
            byte[] secretBytes = decodeSecret(secret);
            if (secretBytes.length < 32) {
                throw new IllegalStateException("JWT_SECRET invalido (minimo 32 bytes)");
            }
        } catch (IllegalStateException ex) {
            throw new IllegalStateException(
                    "JWT configuracao invalida: defina JWT_SECRET no .env (base64 recomendado). " +
                            "Arquivos suportados: ./.env, ../.env, ../../.env",
                    ex
            );
        }
    }

    private Key getSecretKey() {
        byte[] secretBytes = decodeSecret(secret);
        if (secretBytes.length < 32) {
            throw new IllegalStateException("JWT_SECRET invalido (minimo 32 bytes)");
        }
        return Keys.hmacShaKeyFor(secretBytes);
    }

    private byte[] decodeSecret(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalStateException("JWT_SECRET nao configurado");
        }
        try {
            return Base64.getDecoder().decode(value);
        } catch (IllegalArgumentException ignored) {
            return value.getBytes(StandardCharsets.UTF_8);
        }
    }

    public String generateToken(Usuario usuario) {
        return Jwts.builder()
                .id(UUID.randomUUID().toString())
                .subject(usuario.getEmail())
                .claim("tipo", usuario.getTipo().name())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expirationMs))
                .signWith(getSecretKey())
                .compact();
    }

    public String extractEmail(String token) {
        return parseClaims(token).getSubject();
    }

    public String extractTipo(String token) {
        return parseClaims(token).get("tipo", String.class);
    }

    public String extractJti(String token) {
        return parseClaims(token).getId();
    }

    public Date extractExpiration(String token) {
        return parseClaims(token).getExpiration();
    }

    public boolean isTokenValid(String token, Usuario usuario) {
        final String email = extractEmail(token);
        return email.equals(usuario.getEmail()) && !isTokenExpired(token);
    }

    private boolean isTokenExpired(String token) {
        return parseClaims(token).getExpiration().before(new Date());
    }

    private Claims parseClaims(String token) {
        try {
            return Jwts.parser()
                    .verifyWith((javax.crypto.SecretKey) getSecretKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (JwtException | IllegalArgumentException ex) {
            throw ex;
        }
    }
}
