package com.example.tcc_backend.security;

import com.example.tcc_backend.model.TipoUsuario;
import com.example.tcc_backend.model.Usuario;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;

import static org.assertj.core.api.Assertions.assertThat;

class RateLimitFilterTest {

    private final MutableClock clock = new MutableClock();
    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void deveBloquearQuandoExcedeLimiteNaJanela() throws Exception {
        RateLimitFilter filter = new RateLimitFilter(objectMapper, clock, new ClientIpResolver(""), true, 2, 60_000);

        MockHttpServletResponse first = perform(filter, requestFromIp("10.0.0.1"));
        MockHttpServletResponse second = perform(filter, requestFromIp("10.0.0.1"));
        MockHttpServletResponse third = perform(filter, requestFromIp("10.0.0.1"));

        assertThat(first.getStatus()).isEqualTo(200);
        assertThat(second.getStatus()).isEqualTo(200);
        assertThat(third.getStatus()).isEqualTo(429);
        assertThat(third.getHeader("Retry-After")).isEqualTo("60");
        assertThat(third.getHeader("X-RateLimit-Remaining")).isEqualTo("0");
        assertThat(third.getContentAsString()).contains("RATE_LIMIT_EXCEEDED");
    }

    @Test
    void deveLiberarNovamenteQuandoJanelaExpira() throws Exception {
        RateLimitFilter filter = new RateLimitFilter(objectMapper, clock, new ClientIpResolver(""), true, 1, 60_000);

        MockHttpServletResponse first = perform(filter, requestFromIp("10.0.0.2"));
        MockHttpServletResponse blocked = perform(filter, requestFromIp("10.0.0.2"));
        clock.advanceMillis(60_001);
        MockHttpServletResponse afterWindow = perform(filter, requestFromIp("10.0.0.2"));

        assertThat(first.getStatus()).isEqualTo(200);
        assertThat(blocked.getStatus()).isEqualTo(429);
        assertThat(afterWindow.getStatus()).isEqualTo(200);
    }

    @Test
    void deveLimitarPorUsuarioAutenticadoQuandoDisponivel() throws Exception {
        RateLimitFilter filter = new RateLimitFilter(objectMapper, clock, new ClientIpResolver(""), true, 1, 60_000);
        authenticate(1);

        MockHttpServletResponse first = perform(filter, requestFromIp("10.0.0.3"));
        MockHttpServletResponse sameUserOtherIp = perform(filter, requestFromIp("10.0.0.4"));

        SecurityContextHolder.clearContext();
        authenticate(2);
        MockHttpServletResponse otherUserSameIp = perform(filter, requestFromIp("10.0.0.3"));

        assertThat(first.getStatus()).isEqualTo(200);
        assertThat(sameUserOtherIp.getStatus()).isEqualTo(429);
        assertThat(otherUserSameIp.getStatus()).isEqualTo(200);
    }

    @Test
    void naoDeveFiltrarHealthcheck() throws Exception {
        RateLimitFilter filter = new RateLimitFilter(objectMapper, clock, new ClientIpResolver(""), true, 1, 60_000);
        MockHttpServletRequest request = requestFromIp("10.0.0.5");
        request.setRequestURI("/api/health");

        MockHttpServletResponse first = perform(filter, request);
        MockHttpServletResponse second = perform(filter, request);

        assertThat(first.getStatus()).isEqualTo(200);
        assertThat(second.getStatus()).isEqualTo(200);
    }

    private MockHttpServletResponse perform(RateLimitFilter filter, MockHttpServletRequest request) throws Exception {
        MockHttpServletResponse response = new MockHttpServletResponse();
        filter.doFilter(request, response, new MockFilterChain());
        return response;
    }

    private MockHttpServletRequest requestFromIp(String ip) {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/projetos");
        request.setRequestURI("/api/projetos");
        request.setRemoteAddr(ip);
        return request;
    }

    private void authenticate(int userId) {
        Usuario usuario = Usuario.builder()
                .id(userId)
                .nome("Usuario " + userId)
                .email("usuario" + userId + "@teste.com")
                .senha("hash")
                .tipo(TipoUsuario.ALUNO)
                .ativo(true)
                .build();
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(usuario, null, usuario.getAuthorities())
        );
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
