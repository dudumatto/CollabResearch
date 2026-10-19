package com.example.tcc_backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
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
    void deveReaproveitarUrlAssinadaSemNovaChamadaAoSupabase() throws Exception {
        HttpClient httpClient = mock(HttpClient.class);
        HttpResponse<String> response = mock(HttpResponse.class);
        when(response.statusCode()).thenReturn(200);
        when(response.body()).thenReturn("{\"signedURL\":\"/object/sign/documents/arquivo.pdf?token=abc\"}");
        when(httpClient.send(any(HttpRequest.class), anyStringBodyHandler())).thenReturn(response);
        SupabaseStorageService service = new SupabaseStorageService(
                httpClient, "https://example.supabase.co", "service-role-key", "project-deliveries", "documents", new ObjectMapper());

        String primeira = service.createSignedUrl("arquivo.pdf");
        String segunda = service.createSignedUrl("/arquivo.pdf");

        assertThat(segunda).isEqualTo(primeira).isNotNull();
        verify(httpClient, times(1)).send(any(HttpRequest.class), anyStringBodyHandler());
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

    @Test
    void deleteUserDocumentDeveRemoverObjetoDoBucketConfigurado() throws Exception {
        HttpClient httpClient = mock(HttpClient.class);
        HttpResponse<String> response = mock(HttpResponse.class);
        when(response.statusCode()).thenReturn(204);
        when(httpClient.send(any(HttpRequest.class), anyStringBodyHandler())).thenReturn(response);
        SupabaseStorageService service = new SupabaseStorageService(
                httpClient,
                "https://example.supabase.co",
                "service-role-key",
                "project-deliveries",
                "documents",
                new ObjectMapper()
        );

        service.deleteUserDocument("https://example.supabase.co/storage/v1/object/public/documents/usuarios/1/meu%20arquivo.pdf");

        org.mockito.ArgumentCaptor<HttpRequest> captor = org.mockito.ArgumentCaptor.forClass(HttpRequest.class);
        org.mockito.Mockito.verify(httpClient).send(captor.capture(), anyStringBodyHandler());
        assertThat(captor.getValue().method()).isEqualTo("DELETE");
        assertThat(captor.getValue().uri().getPath())
                .isEqualTo("/storage/v1/object/documents/usuarios/1/meu%20arquivo.pdf");
    }

    private static final String FOTO_PUBLICA =
            "https://example.supabase.co/storage/v1/object/public/documents/usuarios/22/foto-perfil/foto-perfil";

    private SupabaseStorageService serviceComAssinaturaMock(HttpClient httpClient) throws Exception {
        HttpResponse<String> response = mock(HttpResponse.class);
        when(response.statusCode()).thenReturn(200);
        when(response.body()).thenReturn("{\"signedURL\":\"/object/sign/documents/usuarios/22/foto-perfil/foto-perfil?token=abc\"}");
        when(httpClient.send(any(HttpRequest.class), anyStringBodyHandler())).thenReturn(response);
        return new SupabaseStorageService(
                httpClient, "https://example.supabase.co", "service-role-key", "project-deliveries", "documents", new ObjectMapper());
    }

    @Test
    void segundaChamadaParaMesmoArquivoDeveReusarUrlAssinada() throws Exception {
        HttpClient httpClient = mock(HttpClient.class);
        SupabaseStorageService service = serviceComAssinaturaMock(httpClient);

        String primeira = service.createDisplayUserDocumentUrl(FOTO_PUBLICA + "?v=1");
        String segunda = service.createDisplayUserDocumentUrl(FOTO_PUBLICA + "?v=2");

        assertThat(segunda).isEqualTo(primeira);
        verify(httpClient, times(1)).send(any(HttpRequest.class), anyStringBodyHandler());
    }

    @Test
    void chamadasConcorrentesParaMesmoArquivoDevemAssinarUmaVez() throws Exception {
        HttpClient httpClient = mock(HttpClient.class);
        SupabaseStorageService service = serviceComAssinaturaMock(httpClient);
        java.util.concurrent.ExecutorService pool = java.util.concurrent.Executors.newFixedThreadPool(8);
        try {
            java.util.List<java.util.concurrent.Future<String>> futuros = new java.util.ArrayList<>();
            for (int i = 0; i < 8; i++) {
                futuros.add(pool.submit(() -> service.createDisplayUserDocumentUrl(FOTO_PUBLICA)));
            }
            for (java.util.concurrent.Future<String> futuro : futuros) {
                futuro.get();
            }
        } finally {
            pool.shutdownNow();
        }

        verify(httpClient, times(1)).send(any(HttpRequest.class), anyStringBodyHandler());
    }

    @Test
    void uploadDoMesmoCaminhoDeveInvalidarUrlAssinada() throws Exception {
        HttpClient httpClient = mock(HttpClient.class);
        SupabaseStorageService service = serviceComAssinaturaMock(httpClient);

        service.createDisplayUserDocumentUrl(FOTO_PUBLICA);
        service.uploadUserAvatar("usuarios/22/foto-perfil", "foto-perfil", new byte[]{1}, "image/png", true);
        service.createDisplayUserDocumentUrl(FOTO_PUBLICA);

        // assinatura + upload + nova assinatura
        verify(httpClient, times(3)).send(any(HttpRequest.class), anyStringBodyHandler());
    }

    @SuppressWarnings("unchecked")
    private static HttpResponse.BodyHandler<String> anyStringBodyHandler() {
        return (HttpResponse.BodyHandler<String>) any(HttpResponse.BodyHandler.class);
    }
}
