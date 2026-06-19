package com.example.tcc_backend.service;

import com.example.tcc_backend.security.AuthHelper;
import com.example.tcc_backend.support.TestDataFactory;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminAccessServiceTest {

    @Mock
    private AuthHelper authHelper;

    @InjectMocks
    private AdminAccessService service;

    @Test
    void devePermitirAdministrador() {
        when(authHelper.getCurrentUser()).thenReturn(TestDataFactory.usuarioAdmin(1));

        assertThat(service.requireAdmin().getId()).isEqualTo(1);
    }

    @Test
    void deveNegarAluno() {
        when(authHelper.getCurrentUser()).thenReturn(TestDataFactory.usuarioAluno(1));

        assertThatThrownBy(() -> service.requireAdmin())
                .isInstanceOf(ResponseStatusException.class)
                .extracting(ex -> ((ResponseStatusException) ex).getStatusCode())
                .isEqualTo(HttpStatus.FORBIDDEN);
    }
}
