package com.example.tcc_backend.security;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class LoginBruteForceProtectionServiceTest {

    private final MutableClock clock = new MutableClock();

    @Test
    void senhaIncorretaAtingeLimiteEBloqueiaCom429() {
        LoginBruteForceProtectionService service = service();

        for (int i = 0; i < 4; i++) {
            service.assertAllowed("user@teste.com", "10.0.0.1");
            service.recordFailure("user@teste.com", "10.0.0.1");
        }

        service.assertAllowed("user@teste.com", "10.0.0.1");
        service.recordFailure("user@teste.com", "10.0.0.1");

        assertThatThrownBy(() -> service.assertAllowed("user@teste.com", "10.0.0.1"))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(ex -> ((ResponseStatusException) ex).getStatusCode())
                .isEqualTo(HttpStatus.TOO_MANY_REQUESTS);
    }

    @Test
    void senhaCorretaTambemERecusadaEnquantoBloqueioEstaAtivo() {
        LoginBruteForceProtectionService service = service();
        lockPair(service, "user@teste.com", "10.0.0.1");

        assertThatThrownBy(() -> service.assertAllowed("user@teste.com", "10.0.0.1"))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(ex -> ((ResponseStatusException) ex).getStatusCode())
                .isEqualTo(HttpStatus.TOO_MANY_REQUESTS);
    }

    @Test
    void aposExpirarCooldownLoginVoltaASerPermitido() {
        LoginBruteForceProtectionService service = service();
        lockPair(service, "user@teste.com", "10.0.0.1");

        clock.advanceMillis(60_001);

        service.assertAllowed("user@teste.com", "10.0.0.1");
    }

    @Test
    void loginBemSucedidoLimpaFalhasAnteriores() {
        LoginBruteForceProtectionService service = service();

        for (int i = 0; i < 4; i++) {
            service.recordFailure("user@teste.com", "10.0.0.1");
        }
        service.recordSuccess("user@teste.com", "10.0.0.1");

        for (int i = 0; i < 4; i++) {
            service.assertAllowed("user@teste.com", "10.0.0.1");
            service.recordFailure("user@teste.com", "10.0.0.1");
        }
        service.assertAllowed("user@teste.com", "10.0.0.1");
    }

    @Test
    void tentativasEmOutraContaNaoBloqueiamUsuarioDiferente() {
        LoginBruteForceProtectionService service = service();
        lockPair(service, "user-a@teste.com", "10.0.0.1");

        service.assertAllowed("user-b@teste.com", "10.0.0.2");
    }

    @Test
    void trocarApenasIpNaoContornaLimitePorEmail() {
        LoginBruteForceProtectionService service = service();

        for (int i = 0; i < 10; i++) {
            service.assertAllowed("user@teste.com", "10.0.0." + i);
            service.recordFailure("user@teste.com", "10.0.0." + i);
        }

        assertThatThrownBy(() -> service.assertAllowed("user@teste.com", "10.0.0.99"))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(ex -> ((ResponseStatusException) ex).getStatusCode())
                .isEqualTo(HttpStatus.TOO_MANY_REQUESTS);
    }

    @Test
    void trocarApenasEmailNaoContornaLimitePorIp() {
        LoginBruteForceProtectionService service = service();

        for (int i = 0; i < 20; i++) {
            service.assertAllowed("user" + i + "@teste.com", "10.0.0.1");
            service.recordFailure("user" + i + "@teste.com", "10.0.0.1");
        }

        assertThatThrownBy(() -> service.assertAllowed("outro@teste.com", "10.0.0.1"))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(ex -> ((ResponseStatusException) ex).getStatusCode())
                .isEqualTo(HttpStatus.TOO_MANY_REQUESTS);
    }

    @Test
    void bloqueioCresceEmReincidenciaAteOMaximoConfigurado() {
        LoginBruteForceProtectionService service = service();
        lockPair(service, "user@teste.com", "10.0.0.1");
        clock.advanceMillis(60_001);
        lockPair(service, "user@teste.com", "10.0.0.1");
        clock.advanceMillis(60_001);

        assertThatThrownBy(() -> service.assertAllowed("user@teste.com", "10.0.0.1"))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(ex -> ((ResponseStatusException) ex).getStatusCode())
                .isEqualTo(HttpStatus.TOO_MANY_REQUESTS);
    }

    private void lockPair(LoginBruteForceProtectionService service, String email, String ip) {
        for (int i = 0; i < 5; i++) {
            service.assertAllowed(email, ip);
            service.recordFailure(email, ip);
        }
    }

    private LoginBruteForceProtectionService service() {
        return new LoginBruteForceProtectionService(clock, true, 5, 10, 20, 900_000, 60_000, 180_000);
    }

    private static class MutableClock extends Clock {
        private Instant instant = Instant.parse("2026-08-29T12:00:00Z");

        void advanceMillis(long millis) {
            instant = instant.plusMillis(millis);
        }

        @Override
        public ZoneId getZone() {
            return ZoneId.of("UTC");
        }

        @Override
        public Clock withZone(ZoneId zone) {
            return this;
        }

        @Override
        public Instant instant() {
            return instant;
        }
    }
}