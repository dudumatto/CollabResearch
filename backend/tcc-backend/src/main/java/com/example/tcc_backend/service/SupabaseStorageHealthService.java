package com.example.tcc_backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class SupabaseStorageHealthService {

    private final HttpClient httpClient;
    private final String supabaseUrl;
    private final String supabaseAnonKey;
    private final String supabaseServiceRoleKey;
    private final String supabaseStorageBucket;

    @Autowired
    public SupabaseStorageHealthService(@Value("${SUPABASE_URL:}") String supabaseUrl,
                                        @Value("${SUPABASE_ANON_KEY:}") String supabaseAnonKey,
                                        @Value("${SUPABASE_SERVICE_ROLE_KEY:}") String supabaseServiceRoleKey,
                                        @Value("${SUPABASE_STORAGE_BUCKET:documents}") String supabaseStorageBucket) {
        this(HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build(),
                supabaseUrl,
                supabaseAnonKey,
                supabaseServiceRoleKey,
                supabaseStorageBucket);
    }

    SupabaseStorageHealthService(HttpClient httpClient,
                                 String supabaseUrl,
                                 String supabaseAnonKey,
                                 String supabaseServiceRoleKey,
                                 String supabaseStorageBucket) {
        this.httpClient = httpClient;
        this.supabaseUrl = supabaseUrl;
        this.supabaseAnonKey = supabaseAnonKey;
        this.supabaseServiceRoleKey = supabaseServiceRoleKey;
        this.supabaseStorageBucket = supabaseStorageBucket;
    }

    public SupabaseStorageHealth check() {
        String storageKey = !isBlank(supabaseServiceRoleKey) ? supabaseServiceRoleKey : supabaseAnonKey;
        if (isBlank(supabaseUrl) || isBlank(storageKey) || isBlank(supabaseStorageBucket)) {
            return SupabaseStorageHealth.unavailable("Supabase Storage nao configurado", supabaseStorageBucket, null);
        }

        try {
            HttpResponse<String> response = httpClient.send(buildRequest(storageKey), HttpResponse.BodyHandlers.ofString());
            boolean ok = response.statusCode() >= 200 && response.statusCode() < 300;
            if (ok) {
                return SupabaseStorageHealth.available(supabaseStorageBucket, response.statusCode());
            }
            return SupabaseStorageHealth.unavailable("Supabase Storage respondeu com erro", supabaseStorageBucket, response.statusCode());
        } catch (IOException ex) {
            return SupabaseStorageHealth.unavailable("Falha ao acessar o Supabase Storage", supabaseStorageBucket, null);
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            return SupabaseStorageHealth.unavailable("Verificacao do Supabase Storage interrompida", supabaseStorageBucket, null);
        } catch (IllegalArgumentException ex) {
            return SupabaseStorageHealth.unavailable("URL do Supabase invalida", supabaseStorageBucket, null);
        }
    }

    private HttpRequest buildRequest(String storageKey) {
        String normalizedUrl = supabaseUrl.replaceAll("/+$", "");
        String bucket = URLEncoder.encode(supabaseStorageBucket, StandardCharsets.UTF_8);

        return HttpRequest.newBuilder()
                .uri(URI.create(normalizedUrl + "/storage/v1/object/list/" + bucket))
                .timeout(Duration.ofSeconds(10))
                .header("apikey", storageKey)
                .header("Authorization", "Bearer " + storageKey)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString("{\"limit\":1,\"offset\":0,\"prefix\":\"\"}"))
                .build();
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    public record SupabaseStorageHealth(
            boolean ok,
            String service,
            String message,
            String bucket,
            Integer upstreamStatus,
            String checkedAt
    ) {
        public static SupabaseStorageHealth available(String bucket, int upstreamStatus) {
            return new SupabaseStorageHealth(true, "supabase-storage", "Supabase Storage acessivel", bucket, upstreamStatus, OffsetDateTime.now().toString());
        }

        public static SupabaseStorageHealth unavailable(String message, String bucket, Integer upstreamStatus) {
            return new SupabaseStorageHealth(false, "supabase-storage", message, bucket, upstreamStatus, OffsetDateTime.now().toString());
        }

        public Map<String, Object> toResponseBody() {
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("ok", ok);
            body.put("service", service);
            body.put("message", message);
            if (bucket != null && !bucket.isBlank()) {
                body.put("bucket", bucket);
            }
            if (upstreamStatus != null) {
                body.put("upstreamStatus", upstreamStatus);
            }
            body.put("checkedAt", checkedAt);
            return body;
        }
    }
}
