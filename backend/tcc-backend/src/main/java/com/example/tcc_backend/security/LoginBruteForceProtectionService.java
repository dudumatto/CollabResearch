package com.example.tcc_backend.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Clock;
import java.util.ArrayDeque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class LoginBruteForceProtectionService {

    private final Clock clock;
    private final boolean enabled;
    private final int pairMaxAttempts;
    private final int emailMaxAttempts;
    private final int ipMaxAttempts;
    private final long windowMillis;
    private final long lockMillis;
    private final long maxLockMillis;
    private final Map<String, AttemptBucket> buckets = new ConcurrentHashMap<>();

    public LoginBruteForceProtectionService(
            Clock clock,
            @Value("${app.login-bruteforce.enabled:true}") boolean enabled,
            @Value("${app.login-bruteforce.pair-max-attempts:5}") int pairMaxAttempts,
            @Value("${app.login-bruteforce.email-max-attempts:10}") int emailMaxAttempts,
            @Value("${app.login-bruteforce.ip-max-attempts:20}") int ipMaxAttempts,
            @Value("${app.login-bruteforce.window-ms:900000}") long windowMillis,
            @Value("${app.login-bruteforce.lock-ms:300000}") long lockMillis,
            @Value("${app.login-bruteforce.max-lock-ms:1800000}") long maxLockMillis) {
        this.clock = clock;
        this.enabled = enabled;
        this.pairMaxAttempts = Math.max(1, pairMaxAttempts);
        this.emailMaxAttempts = Math.max(this.pairMaxAttempts, emailMaxAttempts);
        this.ipMaxAttempts = Math.max(this.pairMaxAttempts, ipMaxAttempts);
        this.windowMillis = Math.max(1000, windowMillis);
        this.lockMillis = Math.max(1000, lockMillis);
        this.maxLockMillis = Math.max(this.lockMillis, maxLockMillis);
    }

    public void assertAllowed(String email, String clientIp) {
        if (!enabled) {
            return;
        }

        long now = clock.millis();
        for (String key : keys(email, clientIp)) {
            AttemptBucket bucket = buckets.get(key);
            if (bucket == null) {
                continue;
            }
            synchronized (bucket) {
                expireOldAttempts(bucket, now);
                if (bucket.lockedUntilMillis > now) {
                    throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Muitas tentativas de login. Aguarde antes de tentar novamente.");
                }
            }
        }
        cleanup(now);
    }

    public void recordFailure(String email, String clientIp) {
        if (!enabled) {
            return;
        }

        long now = clock.millis();
        registerFailure(keyForPair(email, clientIp), pairMaxAttempts, now);
        registerFailure(keyForEmail(email), emailMaxAttempts, now);
        registerFailure(keyForIp(clientIp), ipMaxAttempts, now);
        cleanup(now);
    }

    public void recordSuccess(String email, String clientIp) {
        if (!enabled) {
            return;
        }

        for (String key : keys(email, clientIp)) {
            buckets.remove(key);
        }
    }

    private void registerFailure(String key, int maxAttempts, long now) {
        AttemptBucket bucket = buckets.computeIfAbsent(key, ignored -> new AttemptBucket());
        synchronized (bucket) {
            expireOldAttempts(bucket, now);
            bucket.lastTouchedMillis = now;
            bucket.failedAttempts.addLast(now);
            if (bucket.failedAttempts.size() >= maxAttempts) {
                bucket.lockCount = Math.min(bucket.lockCount + 1, 8);
                long lockDuration = Math.min(maxLockMillis, lockMillis * (1L << Math.min(bucket.lockCount - 1, 6)));
                bucket.lockedUntilMillis = Math.max(bucket.lockedUntilMillis, now + lockDuration);
                bucket.failedAttempts.clear();
            }
        }
    }

    private String[] keys(String email, String clientIp) {
        return new String[] {keyForPair(email, clientIp), keyForEmail(email), keyForIp(clientIp)};
    }

    private String keyForPair(String email, String clientIp) {
        return "pair:" + normalizeEmail(email) + "|" + normalizeIp(clientIp);
    }

    private String keyForEmail(String email) {
        return "email:" + normalizeEmail(email);
    }

    private String keyForIp(String clientIp) {
        return "ip:" + normalizeIp(clientIp);
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }

    private String normalizeIp(String clientIp) {
        return clientIp == null || clientIp.isBlank() ? "unknown" : clientIp.trim();
    }

    private void expireOldAttempts(AttemptBucket bucket, long now) {
        long cutoff = now - windowMillis;
        while (!bucket.failedAttempts.isEmpty() && bucket.failedAttempts.peekFirst() <= cutoff) {
            bucket.failedAttempts.removeFirst();
        }
        if (bucket.lockedUntilMillis <= now && bucket.failedAttempts.isEmpty()) {
            bucket.lockedUntilMillis = 0;
        }
    }

    private void cleanup(long now) {
        for (Map.Entry<String, AttemptBucket> entry : buckets.entrySet()) {
            AttemptBucket bucket = entry.getValue();
            synchronized (bucket) {
                expireOldAttempts(bucket, now);
                if (bucket.failedAttempts.isEmpty() && bucket.lockedUntilMillis == 0 && now - bucket.lastTouchedMillis > windowMillis + maxLockMillis) {
                    buckets.remove(entry.getKey(), bucket);
                }
            }
        }
    }

    private static class AttemptBucket {
        private final ArrayDeque<Long> failedAttempts = new ArrayDeque<>();
        private long lockedUntilMillis;
        private int lockCount;
        private long lastTouchedMillis;
    }
}