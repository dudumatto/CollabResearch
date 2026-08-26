package com.example.tcc_backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class SupabaseStorageServiceTest {

    @Test
    void deveMontarUrlAssinadaSemDuplicarObjectSign() throws Exception {
        HttpClient httpClient = mock(HttpClient.class);
        HttpResponse<String> response = mock(HttpResponse.class);
        when(response.statusCode()).thenReturn(200);
        when(response.body()).thenReturn("{\"signedURL\":\"/object/sign/documents/usuarios/1/curriculo.pdf?token=abc\"}");
        when(httpClient.send(any(HttpRequest.class), anyStringBodyHandler())).thenReturn(response);
        SupabaseStorageService service = new SupabaseStorageService(
                httpClient,
                "https://example.supabase.co/",
                "service-role-key",
                "project-deliveries",
                "documents",
                new ObjectMapper()
        );

        String signedUrl = service.createSignedUserDocumentUrlFromPublicUrl(
                "https://example.supabase.co/storage/v1/object/public/documents/usuarios/1/curriculo.pdf"
        );

        assertThat(signedUrl)
                .isEqualTo("https://example.supabase.co/storage/v1/object/sign/documents/usuarios/1/curriculo.pdf?token=abc");
    }

    @Test
    void deveAceitarSignedUrlAbsoluta() throws Exception {
        HttpClient httpClient = mock(HttpClient.class);
        HttpResponse<String> response = mock(HttpResponse.class);
        when(response.statusCode()).thenReturn(200);
        when(response.body()).thenReturn("{\"signedURL\":\"https://example.supabase.co/storage/v1/object/sign/documents/arquivo.pdf?token=abc\"}");
        when(httpClient.send(any(HttpRequest.class), anyStringBodyHandler())).thenReturn(response);
        SupabaseStorageService service = new SupabaseStorageService(
                httpClient,
                "https://example.supabase.co",
                "service-role-key",
                "project-deliveries",
                "documents",
                new ObjectMapper()
        );

        String signedUrl = service.createSignedUrl("arquivo.pdf");

        assertThat(signedUrl)
                .isEqualTo("https://example.supabase.co/storage/v1/object/sign/documents/arquivo.pdf?token=abc");
    }

    @Test
    void deveMontarUrlAssinadaAPartirDoCaminhoInternoDoUsuario() throws Exception {
        HttpClient httpClient = mock(HttpClient.class);
        HttpResponse<String> response = mock(HttpResponse.class);
        when(response.statusCode()).thenReturn(200);
        when(response.body()).thenReturn("{\"signedURL\":\"/object/sign/documents/usuarios/1/curriculo.pdf?token=abc\"}");
        when(httpClient.send(any(HttpRequest.class), anyStringBodyHandler())).thenReturn(response);
        SupabaseStorageService service = new SupabaseStorageService(
                httpClient,
                "https://example.supabase.co/",
                "service-role-key",
                "project-deliveries",
                "documents",
                new ObjectMapper()
        );

        String signedUrl = service.createSignedUserDocumentUrl("usuarios/1/curriculo.pdf");

        assertThat(signedUrl)
                .isEqualTo("https://example.supabase.co/storage/v1/object/sign/documents/usuarios/1/curriculo.pdf?token=abc");
    }

    @Test
    void deveReassinarUrlAssinadaAntigaSemDuplicarObjectSign() throws Exception {
        HttpClient httpClient = mock(HttpClient.class);
        HttpResponse<String> response = mock(HttpResponse.class);
        when(response.statusCode()).thenReturn(200);
        when(response.body()).thenReturn("{\"signedURL\":\"/object/sign/documents/usuarios/1/curriculo.pdf?token=novo\"}");
        when(httpClient.send(any(HttpRequest.class), anyStringBodyHandler())).thenReturn(response);
        SupabaseStorageService service = new SupabaseStorageService(
                httpClient,
                "https://example.supabase.co/",
                "service-role-key",
                "project-deliveries",
                "documents",
                new ObjectMapper()
        );

        String signedUrl = service.createSignedUserDocumentUrl(
                "https://example.supabase.co/storage/v1/object/sign/documents/usuarios/1/curriculo.pdf?token=antigo"
        );

        assertThat(signedUrl)
                .isEqualTo("https://example.supabase.co/storage/v1/object/sign/documents/usuarios/1/curriculo.pdf?token=novo");
    }

    @Test
    void deveRecuperarUrlAssinadaDuplicadaSalvaAnteriormente() throws Exception {
        HttpClient httpClient = mock(HttpClient.class);
        HttpResponse<String> response = mock(HttpResponse.class);
        when(response.statusCode()).thenReturn(200);
        when(response.body()).thenReturn("{\"signedURL\":\"/object/sign/documents/usuarios/353/curriculo/curriculo.pdf?token=novo\"}");
        when(httpClient.send(any(HttpRequest.class), anyStringBodyHandler())).thenReturn(response);
        SupabaseStorageService service = new SupabaseStorageService(
                httpClient,
                "https://example.supabase.co/",
                "service-role-key",
                "project-deliveries",
                "documents",
                new ObjectMapper()
        );

        String signedUrl = service.createSignedUserDocumentUrl(
                "https://example.supabase.co/storage/v1/object/sign//object/sign/documents/usuarios/353/curriculo/curriculo.pdf?token=antigo"
        );

        assertThat(signedUrl)
                .isEqualTo("https://example.supabase.co/storage/v1/object/sign/documents/usuarios/353/curriculo/curriculo.pdf?token=novo");
    }

    @Test
    void deveRetornarUrlDeExibicaoAssinadaQuandoPossivel() throws Exception {
        HttpClient httpClient = mock(HttpClient.class);
        HttpResponse<String> response = mock(HttpResponse.class);
        when(response.statusCode()).thenReturn(200);
        when(response.body()).thenReturn("{\"signedURL\":\"/object/sign/documents/usuarios/1/foto-perfil/foto-perfil?token=abc\"}");
        when(httpClient.send(any(HttpRequest.class), anyStringBodyHandler())).thenReturn(response);
        SupabaseStorageService service = new SupabaseStorageService(
                httpClient,
                "https://example.supabase.co/",
                "service-role-key",
                "project-deliveries",
                "documents",
                new ObjectMapper()
        );

        String displayUrl = service.createDisplayUserDocumentUrl(
                "https://example.supabase.co/storage/v1/object/public/documents/usuarios/1/foto-perfil/foto-perfil?v=123"
        );

        assertThat(displayUrl)
                .isEqualTo("https://example.supabase.co/storage/v1/object/sign/documents/usuarios/1/foto-perfil/foto-perfil?token=abc");
    }

    @Test
    void devePreservarUrlOriginalQuandoNaoConseguirAssinar() throws Exception {
        HttpClient httpClient = mock(HttpClient.class);
        HttpResponse<String> response = mock(HttpResponse.class);
        when(response.statusCode()).thenReturn(500);
        when(httpClient.send(any(HttpRequest.class), anyStringBodyHandler())).thenReturn(response);
        SupabaseStorageService service = new SupabaseStorageService(
                httpClient,
                "https://example.supabase.co/",
                "service-role-key",
                "project-deliveries",
                "documents",
                new ObjectMapper()
        );
        String publicUrl = "https://example.supabase.co/storage/v1/object/public/documents/usuarios/1/foto-perfil/foto-perfil";

        String displayUrl = service.createDisplayUserDocumentUrl(publicUrl);

        assertThat(displayUrl).isEqualTo(publicUrl);
    }

    @SuppressWarnings("unchecked")
    private static HttpResponse.BodyHandler<String> anyStringBodyHandler() {
        return (HttpResponse.BodyHandler<String>) any(HttpResponse.BodyHandler.class);
    }
}
