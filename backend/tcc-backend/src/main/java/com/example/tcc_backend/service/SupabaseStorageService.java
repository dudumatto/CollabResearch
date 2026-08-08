package com.example.tcc_backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

@Service
public class SupabaseStorageService {

    private static final int SIGNED_URL_EXPIRATION_SECONDS = 3600;

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;
    private final String supabaseUrl;
    private final String supabaseServiceRoleKey;
    private final String projectDocumentsBucket;

    @Autowired
    public SupabaseStorageService(@Value("${SUPABASE_URL:}") String supabaseUrl,
                                  @Value("${SUPABASE_SERVICE_ROLE_KEY:}") String supabaseServiceRoleKey,
                                  @Value("${SUPABASE_PROJECT_DOCUMENTS_BUCKET:project-deliveries}") String projectDocumentsBucket,
                                  ObjectMapper objectMapper) {
        this(HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build(),
                supabaseUrl, supabaseServiceRoleKey, projectDocumentsBucket, objectMapper);
    }

    SupabaseStorageService(HttpClient httpClient,
                           String supabaseUrl,
                           String supabaseServiceRoleKey,
                           String projectDocumentsBucket,
                           ObjectMapper objectMapper) {
        this.httpClient = httpClient;
        this.supabaseUrl = supabaseUrl;
        this.supabaseServiceRoleKey = supabaseServiceRoleKey;
        this.projectDocumentsBucket = projectDocumentsBucket;
        this.objectMapper = objectMapper;
    }

    public boolean isConfigured() {
        return !isBlank(supabaseUrl) && !isBlank(supabaseServiceRoleKey) && !isBlank(projectDocumentsBucket);
    }

    public String upload(String pastaRelativa, String nomeArquivo, byte[] conteudo, String contentType) {
        if (!isConfigured()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Armazenamento de entregas nao configurado");
        }

        String caminho = pastaRelativa.replaceAll("^/+", "").replaceAll("/+$", "") + "/" + nomeArquivo;
        String storagePath = "/storage/v1/object/" + projectDocumentsBucket + "/" + caminho;

        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(normalizedUrl() + storagePath))
                    .timeout(Duration.ofSeconds(30))
                    .header("apikey", supabaseServiceRoleKey)
                    .header("Authorization", "Bearer " + supabaseServiceRoleKey)
                    .header("Content-Type", contentType != null ? contentType : "application/octet-stream")
                    .PUT(HttpRequest.BodyPublishers.ofByteArray(conteudo))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Falha ao enviar arquivo ao armazenamento");
            }
            return caminho;
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Falha ao enviar arquivo ao armazenamento");
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Envio de arquivo interrompido");
        }
    }

    public String createSignedUrl(String caminho) {
        if (!isConfigured() || caminho == null || caminho.isBlank()) {
            return null;
        }

        String cleanPath = caminho.replaceAll("^/+", "");
        String endpoint = "/storage/v1/object/sign/" + URLEncoder.encode(projectDocumentsBucket, StandardCharsets.UTF_8) + "/" + cleanPath;

        try {
            String body = objectMapper.writeValueAsString(java.util.Map.of("expiresIn", SIGNED_URL_EXPIRATION_SECONDS));
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(normalizedUrl() + endpoint))
                    .timeout(Duration.ofSeconds(15))
                    .header("apikey", supabaseServiceRoleKey)
                    .header("Authorization", "Bearer " + supabaseServiceRoleKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                return null;
            }

            JsonNode json = objectMapper.readTree(response.body());
            String signedPath = json.path("signedURL").asText(null);
            if (signedPath == null || signedPath.isBlank()) {
                return null;
            }
            return normalizedUrl() + "/storage/v1/object/sign/" + signedPath;
        } catch (IOException | InterruptedException ex) {
            if (ex instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            return null;
        }
    }

    private String normalizedUrl() {
        return supabaseUrl.replaceAll("/+$", "");
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
