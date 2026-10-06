package com.example.tcc_backend.service;

import com.example.tcc_backend.dto.response.LumenRankingResponse;
import com.example.tcc_backend.dto.response.LumenRankingResponse.CandidatoRanking;
import com.example.tcc_backend.model.Aluno;
import com.example.tcc_backend.model.Inscricao;
import com.example.tcc_backend.model.Projeto;
import com.example.tcc_backend.model.StatusInscricao;
import com.example.tcc_backend.model.Usuario;
import com.example.tcc_backend.repository.InscricaoRepository;
import com.example.tcc_backend.repository.ProjetoRepository;
import com.example.tcc_backend.security.ProjectAccessPolicy;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Lumen AI: ranqueia inscricoes pendentes de um projeto por compatibilidade,
 * via chamada sob demanda a um modelo de linguagem (OpenRouter, API compativel com OpenAI).
 * Decisao final de aprovar/rejeitar continua sempre com o orientador.
 */
@Slf4j
@Service
public class LumenService {

    private final InscricaoRepository inscricaoRepository;
    private final ProjetoRepository projetoRepository;
    private final ProjectAccessPolicy projectAccessPolicy;
    private final ObjectMapper objectMapper;
    private final RestClient restClient;
    private final String apiKey;
    private final String model;

    public LumenService(InscricaoRepository inscricaoRepository,
                         ProjetoRepository projetoRepository,
                         ProjectAccessPolicy projectAccessPolicy,
                         ObjectMapper objectMapper,
                         @Value("${lumen.api.key:}") String apiKey,
                         @Value("${lumen.api.url:https://openrouter.ai/api/v1/chat/completions}") String apiUrl,
                         @Value("${lumen.model:nvidia/nemotron-3-ultra-550b-a55b:free}") String model,
                         @Value("${lumen.timeout-ms:15000}") long timeoutMs) {
        this.inscricaoRepository = inscricaoRepository;
        this.projetoRepository = projetoRepository;
        this.projectAccessPolicy = projectAccessPolicy;
        this.objectMapper = objectMapper;
        this.apiKey = apiKey;
        this.model = model;

        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        Duration timeout = Duration.ofMillis(Math.max(1000, timeoutMs));
        requestFactory.setConnectTimeout(timeout);
        requestFactory.setReadTimeout(timeout);

        this.restClient = RestClient.builder()
                .baseUrl(apiUrl)
                .requestFactory(requestFactory)
                .build();
    }

    public LumenRankingResponse ranquear(Integer projetoId, Usuario usuario) {
        Projeto projeto = projetoRepository.findById(projetoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Projeto nao encontrado"));

        projectAccessPolicy.requireCanViewApplications(projeto, usuario);

        List<Inscricao> pendentes = inscricaoRepository.findByProjetoIdAndStatus(projetoId, StatusInscricao.PENDENTE);
        if (pendentes.isEmpty()) {
            return new LumenRankingResponse(List.of(), "Nenhuma inscricao pendente para analisar.");
        }

        if (!StringUtils.hasText(apiKey)) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Lumen AI nao configurada (LUMEN_API_KEY ausente)");
        }

        String prompt = buildPrompt(projeto, pendentes);
        String content = callOpenRouter(prompt);
        return parseResponse(content);
    }

    private String buildPrompt(Projeto projeto, List<Inscricao> pendentes) {
        StringBuilder sb = new StringBuilder();
        sb.append("Projeto: ").append(nullToVazio(projeto.getTitulo())).append('\n');
        sb.append("Area: ").append(projeto.getArea() != null ? nullToVazio(projeto.getArea().getNome()) : "").append('\n');
        sb.append("Descricao: ").append(nullToVazio(projeto.getDescricao())).append('\n');
        sb.append("Requisitos: ").append(nullToVazio(projeto.getRequisitos())).append('\n');
        sb.append("Tecnologias: ").append(nullToVazio(projeto.getTecnologias())).append("\n\n");
        sb.append("Candidatos:\n");

        for (int i = 0; i < pendentes.size(); i++) {
            Inscricao inscricao = pendentes.get(i);
            Aluno aluno = inscricao.getAluno();
            String nome = aluno != null && aluno.getUsuario() != null ? aluno.getUsuario().getNome() : "Desconhecido";
            String curso = aluno != null && aluno.getCurso() != null ? aluno.getCurso().getNome() : "-";
            String semestre = aluno != null && aluno.getSemestre() != null ? aluno.getSemestre().toString() : "-";
            String interesses = aluno != null ? nullToVazio(aluno.getInteresses()) : "";

            sb.append(i + 1).append(". inscricaoId=").append(inscricao.getId())
                    .append(" | Nome: ").append(nome)
                    .append(" | Semestre: ").append(semestre)
                    .append(" | Curso: ").append(curso)
                    .append(" | Interesses: ").append(interesses).append('\n')
                    .append("   Motivacao: ").append(nullToVazio(inscricao.getMotivacao())).append('\n');
        }

        sb.append("\nRanqueie os candidatos do mais ao menos compativel com o projeto acima.\n");
        sb.append("Responda SOMENTE com um array JSON valido, sem texto adicional, nesse formato exato:\n");
        sb.append("[{\"inscricaoId\":1,\"nomeAluno\":\"...\",\"pontuacao\":8,\"justificativa\":\"...\"}]");
        return sb.toString();
    }

    private String callOpenRouter(String prompt) {
        Map<String, Object> body = Map.of(
                "model", model,
                "messages", List.of(Map.of("role", "user", "content", prompt))
        );

        JsonNode response;
        try {
            String raw = restClient.post()
                    .contentType(MediaType.APPLICATION_JSON)
                    .header("Authorization", "Bearer " + apiKey)
                    .body(body)
                    .retrieve()
                    .body(String.class);
            response = raw != null ? objectMapper.readTree(raw) : null;
        } catch (Exception ex) {
            log.warn("Falha ao chamar Lumen AI (OpenRouter): {}", ex.getMessage());
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Lumen AI indisponivel no momento");
        }

        JsonNode content = response == null
                ? null
                : response.path("choices").path(0).path("message").path("content");
        if (content == null || content.isMissingNode() || !StringUtils.hasText(content.asText())) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Lumen AI retornou resposta vazia");
        }
        return content.asText();
    }

    private LumenRankingResponse parseResponse(String content) {
        String json = extractJsonArray(content);
        try {
            List<CandidatoRanking> ranking = objectMapper.readValue(json,
                    objectMapper.getTypeFactory().constructCollectionType(List.class, CandidatoRanking.class));
            List<CandidatoRanking> ordenado = ranking.stream()
                    .sorted((a, b) -> Integer.compare(b.pontuacao(), a.pontuacao()))
                    .collect(Collectors.toList());
            return new LumenRankingResponse(ordenado,
                    "Sugestao gerada por IA. A decisao final e sempre do orientador.");
        } catch (Exception ex) {
            log.warn("Falha ao interpretar resposta da Lumen AI: {}", ex.getMessage());
            return new LumenRankingResponse(List.of(),
                    "Nao foi possivel interpretar a resposta da IA. Tente novamente.");
        }
    }

    private static String extractJsonArray(String content) {
        String trimmed = content.trim();
        int start = trimmed.indexOf('[');
        int end = trimmed.lastIndexOf(']');
        if (start >= 0 && end > start) {
            return trimmed.substring(start, end + 1);
        }
        return trimmed;
    }

    private static String nullToVazio(String value) {
        return value == null ? "" : value;
    }
}
