package com.example.tcc_backend.service;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class GoogleOAuthServiceTest {

    @Test
    void verifyAceitaTokenComAudienciaEmailVerificadoEHostedDomainPermitido() {
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        GoogleOAuthService service = new GoogleOAuthService(
                builder.baseUrl("https://oauth2.googleapis.com").build(),
                "client-id",
                "unicamp.br"
        );

        server.expect(requestTo("https://oauth2.googleapis.com/tokeninfo?id_token=valid-token"))
                .andRespond(withSuccess("""
                        {
                          "aud": "client-id",
                          "sub": "google-sub-123",
                          "email": "rodrigo@unicamp.br",
                          "email_verified": "true",
                          "hd": "unicamp.br",
                          "name": "Rodrigo",
                          "picture": "https://lh3.googleusercontent.com/foto"
                        }
                        """, MediaType.APPLICATION_JSON));

        GoogleTokenInfo tokenInfo = service.verify("valid-token");

        assertThat(tokenInfo.subject()).isEqualTo("google-sub-123");
        assertThat(tokenInfo.email()).isEqualTo("rodrigo@unicamp.br");
        assertThat(tokenInfo.hostedDomain()).isEqualTo("unicamp.br");
        server.verify();
    }

    @Test
    void verifyRecusaEmailPermitidoSemHostedDomainWorkspace() {
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        GoogleOAuthService service = new GoogleOAuthService(
                builder.baseUrl("https://oauth2.googleapis.com").build(),
                "client-id",
                "unicamp.br"
        );

        server.expect(requestTo("https://oauth2.googleapis.com/tokeninfo?id_token=valid-token"))
                .andRespond(withSuccess("""
                        {
                          "aud": "client-id",
                          "sub": "google-sub-123",
                          "email": "rodrigo@unicamp.br",
                          "email_verified": "true"
                        }
                        """, MediaType.APPLICATION_JSON));

        assertThatThrownBy(() -> service.verify("valid-token"))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(ex -> ((ResponseStatusException) ex).getStatusCode())
                .isEqualTo(HttpStatus.FORBIDDEN);

        server.verify();
    }

    @Test
    void verifyRecusaTokenDeOutroClientId() {
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        GoogleOAuthService service = new GoogleOAuthService(
                builder.baseUrl("https://oauth2.googleapis.com").build(),
                "client-id",
                "unicamp.br"
        );

        server.expect(requestTo("https://oauth2.googleapis.com/tokeninfo?id_token=valid-token"))
                .andRespond(withSuccess("""
                        {
                          "aud": "outro-client-id",
                          "sub": "google-sub-123",
                          "email": "rodrigo@unicamp.br",
                          "email_verified": "true",
                          "hd": "unicamp.br"
                        }
                        """, MediaType.APPLICATION_JSON));

        assertThatThrownBy(() -> service.verify("valid-token"))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(ex -> ((ResponseStatusException) ex).getStatusCode())
                .isEqualTo(HttpStatus.UNAUTHORIZED);

        server.verify();
    }
}
