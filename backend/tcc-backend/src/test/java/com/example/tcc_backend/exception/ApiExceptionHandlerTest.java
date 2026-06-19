package com.example.tcc_backend.exception;

import com.example.tcc_backend.dto.response.ApiErrorResponse;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.authentication.BadCredentialsException;

import static org.assertj.core.api.Assertions.assertThat;

class ApiExceptionHandlerTest {

    private final ApiExceptionHandler handler = new ApiExceptionHandler();

    @Test
    void credenciaisInvalidasDevemRetornarUnauthorized() {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/auth/login");

        ResponseEntity<ApiErrorResponse> response = handler.handleAuthentication(
                new BadCredentialsException("Bad credentials"),
                request
        );

        assertThat(response.getStatusCode().value()).isEqualTo(401);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getCode()).isEqualTo("UNAUTHORIZED");
        assertThat(response.getBody().getMessage()).isEqualTo("Credenciais invalidas");
        assertThat(response.getBody().getPath()).isEqualTo("/api/auth/login");
    }
}
