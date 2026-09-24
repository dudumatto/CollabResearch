package com.example.tcc_backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.util.Arrays;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class GoogleOAuthService {

    private final RestClient restClient;
    private final String clientId;
    private final Set<String> allowedDomains;

    @Autowired(required = false)
    public GoogleOAuthService(@Value("${app.google.client-id:}") String clientId,
                              @Value("${app.google.allowed-domains:unicamp.br}") String allowedDomains,
                              @Value("${app.google.timeout-ms:3000}") long timeoutMillis) {
        this(RestClient.builder(), clientId, allowedDomains, timeoutMillis);
    }

    // Construtor padrão necessário para injeção do Spring
    // Será usado apenas se as propriedades não estiverem configuradas
    public GoogleOAuthService() {
        this.restClient = RestClient.builder().build();
        this.clientId = "";
        this.allowedDomains = Set.of("unicamp.br", "cotil.unicamp.br");
    }

    GoogleOAuthService(RestClient.Builder restClientBuilder,
                       String clientId,
                       String allowedDomains,
                       long timeoutMillis) {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        Duration timeout = Duration.ofMillis(Math.max(500, timeoutMillis));
        requestFactory.setConnectTimeout(timeout);
        requestFactory.setReadTimeout(timeout);

        RestClient restClient = restClientBuilder
                .baseUrl("https://oauth2.googleapis.com")
                .requestFactory(requestFactory)
                .build();
        this.restClient = restClient;
        this.clientId = normalize(clientId);
        this.allowedDomains = parseAllowedDomains(allowedDomains);
    }

    GoogleOAuthService(RestClient restClient, String clientId, String allowedDomains) {
        this.restClient = restClient;
        this.clientId = normalize(clientId);
        this.allowedDomains = parseAllowedDomains(allowedDomains);
    }

    private static Set<String> parseAllowedDomains(String allowedDomains) {
        return Arrays.stream(allowedDomains.split(","))
                .map(GoogleOAuthService::normalizeDomain)
                .filter(StringUtils::hasText)
                .collect(Collectors.toUnmodifiableSet());
    }

    public GoogleTokenInfo verify(String idToken) {
        if (!StringUtils.hasText(clientId)) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Login com Google nao configurado");
        }
        if (allowedDomains.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Dominio institucional do Google nao configurado");
        }

        Map<?, ?> payload;
        try {
            payload = restClient.get()
                    .uri(uriBuilder -> uriBuilder.path("/tokeninfo")
                            .queryParam("id_token", idToken)
                            .build())
                    .retrieve()
                    .body(Map.class);
        } catch (RestClientException ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token do Google invalido ou expirado");
        }

        String audience = asString(payload, "aud");
        if (!clientId.equals(audience)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token do Google nao pertence a esta aplicacao");
        }

        String subject = asString(payload, "sub");
        String email = normalize(asString(payload, "email"));
        boolean emailVerified = Boolean.parseBoolean(asString(payload, "email_verified"));
        String hostedDomain = normalizeDomain(asString(payload, "hd"));

        if (!StringUtils.hasText(subject) || !StringUtils.hasText(email) || !emailVerified) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Conta Google sem e-mail verificado");
        }

        int atIndex = email.lastIndexOf('@');
        if (atIndex <= 0 || atIndex == email.length() - 1) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Conta Google sem e-mail valido");
        }

        String emailDomain = normalizeDomain(email.substring(atIndex + 1));
        if (!StringUtils.hasText(hostedDomain) || !isAllowedDomain(hostedDomain) || !isAllowedDomain(emailDomain)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Use uma conta Google Workspace institucional aceita");
        }

        return new GoogleTokenInfo(
                subject,
                email,
                true,
                hostedDomain,
                asString(payload, "name"),
                asString(payload, "picture")
        );
    }

    private boolean isAllowedDomain(String domain) {
        return allowedDomains.contains(normalizeDomain(domain));
    }

    private static String asString(Map<?, ?> payload, String key) {
        Object value = payload == null ? null : payload.get(key);
        return value == null ? "" : String.valueOf(value).trim();
    }

    private static String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }

    private static String normalizeDomain(String value) {
        String normalized = normalize(value);
        return normalized.startsWith("@") ? normalized.substring(1) : normalized;
    }
}
