package com.example.tcc_backend.security;

import com.example.tcc_backend.dto.response.ApiErrorResponse;
import com.example.tcc_backend.model.Usuario;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.ArrayDeque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private final ObjectMapper objectMapper;
    private final Clock clock;
    private final ClientIpResolver clientIpResolver;
    private final boolean enabled;
    private final int maxRequests;
    private final long windowMillis;
    private final Map<String, ArrayDeque<Long>> requestsByKey = new ConcurrentHashMap<>();

    public RateLimitFilter(
            ObjectMapper objectMapper,
            Clock clock,
            ClientIpResolver clientIpResolver,
            @Value("${app.rate-limit.enabled:true}") boolean enabled,
            @Value("${app.rate-limit.max-requests:120}") int maxRequests,
            @Value("${app.rate-limit.window-ms:60000}") long windowMillis) {
        this.objectMapper = objectMapper;
        this.clock = clock;
        this.clientIpResolver = clientIpResolver;
        this.enabled = enabled;
        this.maxRequests = Math.max(1, maxRequests);
        this.windowMillis = Math.max(1000, windowMillis);
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return !enabled
                || "OPTIONS".equalsIgnoreCase(request.getMethod())
                || path.equals("/api/health")
                || path.startsWith("/api/health/")
                || path.equals("/favicon.ico")
                || path.equals("/error")
                || path.equals("/ws")
                || path.startsWith("/ws/")
                || path.startsWith("/v3/api-docs")
                || path.startsWith("/swagger-ui");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        RateLimitDecision decision = registerRequest(resolveClientKey(request));
        writeRateLimitHeaders(response, decision);

        if (!decision.allowed()) {
            writeRateLimitError(response, request, decision);
            return;
        }

        filterChain.doFilter(request, response);
    }

    private RateLimitDecision registerRequest(String key) {
        long now = clock.millis();
        long cutoff = now - windowMillis;
        long retryAfterMillis;
        int remaining;

        synchronized (requestsByKey.computeIfAbsent(key, ignored -> new ArrayDeque<>())) {
            ArrayDeque<Long> timestamps = requestsByKey.get(key);
            while (!timestamps.isEmpty() && timestamps.peekFirst() <= cutoff) {
                timestamps.removeFirst();
            }

            if (timestamps.size() >= maxRequests) {
                retryAfterMillis = Math.max(1000, windowMillis - (now - timestamps.peekFirst()));
                return new RateLimitDecision(false, 0, retryAfterMillis);
            }

            timestamps.addLast(now);
            remaining = Math.max(0, maxRequests - timestamps.size());
            retryAfterMillis = timestamps.isEmpty() ? windowMillis : Math.max(1000, windowMillis - (now - timestamps.peekFirst()));
        }

        cleanupExpiredBuckets(cutoff);
        return new RateLimitDecision(true, remaining, retryAfterMillis);
    }

    private void cleanupExpiredBuckets(long cutoff) {
        for (Map.Entry<String, ArrayDeque<Long>> entry : requestsByKey.entrySet()) {
            synchronized (entry.getValue()) {
                while (!entry.getValue().isEmpty() && entry.getValue().peekFirst() <= cutoff) {
                    entry.getValue().removeFirst();
                }
                if (entry.getValue().isEmpty()) {
                    requestsByKey.remove(entry.getKey(), entry.getValue());
                }
            }
        }
    }

    private String resolveClientKey(HttpServletRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Object principal = authentication != null ? authentication.getPrincipal() : null;
        if (principal instanceof Usuario usuario && usuario.getId() != null) {
            return "user:" + usuario.getId();
        }

        return "ip:" + clientIpResolver.resolve(request);
    }

    private void writeRateLimitHeaders(HttpServletResponse response, RateLimitDecision decision) {
        response.setHeader("X-RateLimit-Limit", String.valueOf(maxRequests));
        response.setHeader("X-RateLimit-Remaining", String.valueOf(decision.remaining()));
        response.setHeader("X-RateLimit-Window", String.valueOf(windowMillis / 1000));
        if (!decision.allowed()) {
            response.setHeader("Retry-After", String.valueOf(Math.max(1, (decision.retryAfterMillis() + 999) / 1000)));
        }
    }

    private void writeRateLimitError(HttpServletResponse response,
                                     HttpServletRequest request,
                                     RateLimitDecision decision) throws IOException {
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);

        ApiErrorResponse body = ApiErrorResponse.builder()
                .code("RATE_LIMIT_EXCEEDED")
                .message("Muitas requisicoes. Aguarde antes de tentar novamente.")
                .status(HttpStatus.TOO_MANY_REQUESTS.value())
                .path(request.getRequestURI())
                .timestamp(LocalDateTime.now())
                .build();

        objectMapper.writeValue(response.getWriter(), body);
    }

    private record RateLimitDecision(boolean allowed, int remaining, long retryAfterMillis) {
    }
}