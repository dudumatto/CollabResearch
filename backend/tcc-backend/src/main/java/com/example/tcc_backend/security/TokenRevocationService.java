package com.example.tcc_backend.security;

import com.example.tcc_backend.service.JwtService;
import io.jsonwebtoken.JwtException;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class TokenRevocationService {

    private final JwtService jwtService;
    private final Map<String, Long> revokedUntilByJti = new ConcurrentHashMap<>();

    public TokenRevocationService(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    public void revoke(String token) {
        if (token == null || token.isBlank()) {
            return;
        }

        try {
            String jti = jwtService.extractJti(token);
            Date exp = jwtService.extractExpiration(token);
            if (jti == null || jti.isBlank() || exp == null) {
                return;
            }
            revokedUntilByJti.put(jti, exp.getTime());
            cleanupExpired();
        } catch (JwtException | IllegalArgumentException ignored) {
            // token invalido: nada a revogar
        }
    }

    public boolean isRevoked(String token) {
        if (token == null || token.isBlank()) {
            return false;
        }
        cleanupExpired();

        try {
            String jti = jwtService.extractJti(token);
            if (jti == null || jti.isBlank()) {
                return false;
            }
            Long until = revokedUntilByJti.get(jti);
            return until != null && until > System.currentTimeMillis();
        } catch (JwtException | IllegalArgumentException ignored) {
            return false;
        }
    }

    private void cleanupExpired() {
        long now = System.currentTimeMillis();
        revokedUntilByJti.entrySet().removeIf(entry -> entry.getValue() == null || entry.getValue() <= now);
    }
}

