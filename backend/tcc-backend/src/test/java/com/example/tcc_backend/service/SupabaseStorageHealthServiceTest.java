package com.example.tcc_backend.service;

import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class SupabaseStorageHealthServiceTest {

    @Test
    void deveRetornarIndisponivelQuandoNaoConfigurado() {
        HttpClient httpClient = mock(HttpClient.class);
        SupabaseStorageHealthService service = new SupabaseStorageHealthService(httpClient, "", "", "", "documents");

        SupabaseStorageHealthService.SupabaseStorageHealth health = service.check();

        assertThat(health.ok()).isFalse();
        assertThat(health.message()).isEqualTo("Supabase Storage nao configurado");
        verifyNoInteractions(httpClient);
    }

    @Test
    void deveRetornarDisponivelQuandoSupabaseResponderSucesso() throws Exception {
        HttpClient httpClient = mock(HttpClient.class);
        HttpResponse<String> response = mock(HttpResponse.class);
        when(response.statusCode()).thenReturn(200);
        when(httpClient.send(any(HttpRequest.class), anyStringBodyHandler())).thenReturn(response);
        SupabaseStorageHealthService service = new SupabaseStorageHealthService(
                httpClient,
                "https://example.supabase.co/",
                "anon-key",
                "",
                "documents"
        );

        SupabaseStorageHealthService.SupabaseStorageHealth health = service.check();

        assertThat(health.ok()).isTrue();
        assertThat(health.bucket()).isEqualTo("documents");
        assertThat(health.upstreamStatus()).isEqualTo(200);
    }

    @Test
    void deveRetornarIndisponivelQuandoSupabaseResponderErro() throws Exception {
        HttpClient httpClient = mock(HttpClient.class);
        HttpResponse<String> response = mock(HttpResponse.class);
        when(response.statusCode()).thenReturn(401);
        when(httpClient.send(any(HttpRequest.class), anyStringBodyHandler())).thenReturn(response);
        SupabaseStorageHealthService service = new SupabaseStorageHealthService(
                httpClient,
                "https://example.supabase.co",
                "anon-key",
                "",
                "documents"
        );

        SupabaseStorageHealthService.SupabaseStorageHealth health = service.check();

        assertThat(health.ok()).isFalse();
        assertThat(health.message()).isEqualTo("Supabase Storage respondeu com erro");
        assertThat(health.upstreamStatus()).isEqualTo(401);
    }

    @Test
    void deveRetornarIndisponivelQuandoUrlForInvalida() {
        HttpClient httpClient = mock(HttpClient.class);
        SupabaseStorageHealthService service = new SupabaseStorageHealthService(
                httpClient,
                "http://",
                "anon-key",
                "",
                "documents"
        );

        SupabaseStorageHealthService.SupabaseStorageHealth health = service.check();

        assertThat(health.ok()).isFalse();
        assertThat(health.message()).isEqualTo("URL do Supabase invalida");
    }

    @Test
    void deveRetornarIndisponivelQuandoChamadaFalhar() throws Exception {
        HttpClient httpClient = mock(HttpClient.class);
        when(httpClient.send(any(HttpRequest.class), anyStringBodyHandler())).thenThrow(new IOException("timeout"));
        SupabaseStorageHealthService service = new SupabaseStorageHealthService(
                httpClient,
                "https://example.supabase.co",
                "anon-key",
                "",
                "documents"
        );

        SupabaseStorageHealthService.SupabaseStorageHealth health = service.check();

        assertThat(health.ok()).isFalse();
        assertThat(health.message()).isEqualTo("Falha ao acessar o Supabase Storage");
    }

    @SuppressWarnings("unchecked")
    private static HttpResponse.BodyHandler<String> anyStringBodyHandler() {
        return (HttpResponse.BodyHandler<String>) any(HttpResponse.BodyHandler.class);
    }
}
