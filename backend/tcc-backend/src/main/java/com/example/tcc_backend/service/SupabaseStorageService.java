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
import java.net.URLDecoder;
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
    private final String userDocumentsBucket;

    @Autowired
    public SupabaseStorageService(@Value("${SUPABASE_URL:}") String supabaseUrl,
                                  @Value("${SUPABASE_SERVICE_ROLE_KEY:}") String supabaseServiceRoleKey,
                                  @Value("${SUPABASE_PROJECT_DOCUMENTS_BUCKET:project-deliveries}") String projectDocumentsBucket,
                                  @Value("${SUPABASE_STORAGE_BUCKET:documents}") String userDocumentsBucket,
                                  ObjectMapper objectMapper) {
        this(HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build(),
                supabaseUrl, supabaseServiceRoleKey, projectDocumentsBucket, userDocumentsBucket, objectMapper);
    }

    SupabaseStorageService(HttpClient httpClient,
                           String supabaseUrl,
                           String supabaseServiceRoleKey,
                           String projectDocumentsBucket,
                           String userDocumentsBucket,
                           ObjectMapper objectMapper) {
        this.httpClient = httpClient;
        this.supabaseUrl = supabaseUrl;
        this.supabaseServiceRoleKey = supabaseServiceRoleKey;
        this.projectDocumentsBucket = projectDocumentsBucket;
        this.userDocumentsBucket = userDocumentsBucket;
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
        return createSignedUrl(projectDocumentsBucket, caminho);
    }

    public String createSignedUserDocumentUrl(String documentReference) {
        StorageObjectRef ref = parseUserDocumentReference(documentReference);
        if (ref == null || !ref.bucket().equals(userDocumentsBucket)) {
            return null;
        }
        return createSignedUrl(ref.bucket(), ref.path());
    }

    public String createSignedUserDocumentUrlFromPublicUrl(String publicUrl) {
        return createSignedUserDocumentUrl(publicUrl);
    }

    public boolean isUserDocumentReference(String documentReference) {
        StorageObjectRef ref = parseUserDocumentReference(documentReference);
        return ref != null && ref.bucket().equals(userDocumentsBucket);
    }

    public boolean isUserDocumentPublicUrl(String publicUrl) {
        return isUserDocumentReference(publicUrl);
    }

    private String createSignedUrl(String bucket, String caminho) {
        if (!isConfigured() || isBlank(bucket) || caminho == null || caminho.isBlank()) {
            return null;
        }

        String cleanPath = caminho.replaceAll("^/+", "");
        String endpoint = "/storage/v1/object/sign/" + URLEncoder.encode(bucket, StandardCharsets.UTF_8) + "/" + cleanPath;

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
            return buildSignedUrl(signedPath);
        } catch (IOException | InterruptedException ex) {
            if (ex instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            return null;
        }
    }

    private String buildSignedUrl(String signedPath) {
        if (isBlank(signedPath)) {
            return null;
        }

        String trimmed = signedPath.trim();
        if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
            return trimmed;
        }

        String relativePath = trimmed.startsWith("/") ? trimmed : "/" + trimmed;
        if (relativePath.startsWith("/storage/v1/")) {
            return normalizedUrl() + relativePath;
        }
        return normalizedUrl() + "/storage/v1" + relativePath;
    }

    private StorageObjectRef parseUserDocumentReference(String documentReference) {
        if (isBlank(documentReference)) {
            return null;
        }

        String trimmed = documentReference.trim();
        if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
            String cleanPath = trimmed.replaceAll("^/+", "");
            if (cleanPath.isBlank() || cleanPath.contains("..") || cleanPath.contains(":") || cleanPath.contains("\\") || cleanPath.startsWith("object/") || cleanPath.startsWith("storage/")) {
                return null;
            }
            return new StorageObjectRef(userDocumentsBucket, cleanPath);
        }

        if (isBlank(supabaseUrl)) {
            return null;
        }

        try {
            URI base = URI.create(normalizedUrl());
            URI uri = URI.create(trimmed);
            if (uri.getHost() == null || !uri.getHost().equalsIgnoreCase(base.getHost())) {
                return null;
            }

            String path = uri.getPath();
            String[] markers = {
                    "/storage/v1/object/public/",
                    "/storage/v1/object/sign/"
            };
            for (String marker : markers) {
                int markerIndex = path.indexOf(marker);
                if (markerIndex < 0) {
                    continue;
                }
                String remainder = normalizeStorageObjectRemainder(path.substring(markerIndex + marker.length()));
                int slashIndex = remainder.indexOf('/');
                if (slashIndex <= 0 || slashIndex == remainder.length() - 1) {
                    return null;
                }
                String bucket = URLDecoder.decode(remainder.substring(0, slashIndex), StandardCharsets.UTF_8);
                String objectPath = URLDecoder.decode(remainder.substring(slashIndex + 1), StandardCharsets.UTF_8);
                return new StorageObjectRef(bucket, objectPath);
            }
            return null;
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }


    private String normalizeStorageObjectRemainder(String remainder) {
        String normalized = remainder == null ? "" : remainder.replaceAll("^/+", "");
        while (normalized.startsWith("object/sign/") || normalized.startsWith("object/public/")) {
            normalized = normalized
                    .replaceFirst("^object/sign/+", "")
                    .replaceFirst("^object/public/+", "");
        }
        return normalized;
    }
    private String normalizedUrl() {
        return supabaseUrl.replaceAll("/+$", "");
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private record StorageObjectRef(String bucket, String path) {
    }
}