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
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
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

        // Candidatos ja avaliados mantem a nota salva; so os novos sao enviados a IA.
        List<Inscricao> novos = pendentes.stream().filter(i -> i.getLumenPontuacao() == null).toList();
        if (novos.isEmpty()) {
            return new LumenRankingResponse(List.of(), "Todos os candidatos pendentes ja foram avaliados pela Lumen.");
        }

        if (!StringUtils.hasText(apiKey)) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Lumen AI nao configurada (LUMEN_API_KEY ausente)");
        }

        String prompt = buildPrompt(projeto, novos);
        String content = callOpenRouter(prompt);
        LumenRankingResponse resposta = parseResponse(content, novos);
        salvarAvaliacoes(novos, resposta);
        return resposta;
    }

    private void salvarAvaliacoes(List<Inscricao> pendentes, LumenRankingResponse resposta) {
        Map<Integer, CandidatoRanking> porInscricao = resposta.ranking().stream()
                .filter(c -> c.inscricaoId() != null)
                .collect(Collectors.toMap(CandidatoRanking::inscricaoId, c -> c, (a, b) -> a));
        List<Inscricao> atualizadas = pendentes.stream()
                .filter(i -> porInscricao.containsKey(i.getId()))
                .peek(i -> {
                    CandidatoRanking c = porInscricao.get(i.getId());
                    i.setLumenPontuacao(c.pontuacao());
                    i.setLumenJustificativa(c.justificativa());
                })
                .toList();
        inscricaoRepository.saveAll(atualizadas);
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

        sb.append("\nAvalie CADA candidato de forma independente e absoluta (sem compara-lo com os demais), ")
                .append("usando SOMENTE os dados fornecidos acima. Nao invente informacoes; dado ausente ")
                .append("deve reduzir apenas o criterio correspondente.\n");
        sb.append("Atribua uma nota inteira de 0 a 10 para cada criterio:\n");
        sb.append("- requisitos: aderencia aos requisitos e tecnologias do projeto (0 = nenhuma evidencia, 10 = atende plenamente)\n");
        sb.append("- area: afinidade do curso e dos interesses com a area do projeto\n");
        sb.append("- motivacao: clareza, especificidade e coerencia da motivacao com o projeto (textos genericos ficam abaixo de 5)\n");
        sb.append("- maturidade: semestre cursado e preparo academico para o escopo do projeto\n");
        sb.append("Responda SOMENTE com um array JSON valido, sem texto adicional, nesse formato exato:\n");
        sb.append("[{\"inscricaoId\":1,\"nomeAluno\":\"...\",\"criterios\":{\"requisitos\":0,\"area\":0,\"motivacao\":0,\"maturidade\":0},")
                .append("\"justificativa\":\"2 a 3 frases objetivas citando as evidencias usadas\"}]");
        return sb.toString();
    }

    private String callOpenRouter(String prompt) {
        Map<String, Object> body = Map.of(
                "model", model,
                "messages", List.of(Map.of("role", "user", "content", prompt)),
                // Modelos de raciocinio gastam tokens "pensando"; sem folga o content volta vazio.
                "max_tokens", 4000,
                "temperature", 0,
                "seed", 42
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

        JsonNode message = response == null ? null : response.path("choices").path(0).path("message");
        String texto = textoOuNull(message, "content");
        if (texto == null || !texto.contains("[")) {
            // Alguns modelos gratuitos entregam a resposta apenas no campo de raciocinio.
            String raciocinio = firstNonBlank(textoOuNull(message, "reasoning"), textoOuNull(message, "reasoning_content"));
            if (raciocinio != null && raciocinio.contains("[")) texto = raciocinio;
        }
        if (!StringUtils.hasText(texto)) {
            log.warn("Lumen AI retornou resposta vazia. Corpo recebido: {}", response);
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Lumen AI retornou resposta vazia");
        }
        return texto;
    }

    private static String textoOuNull(JsonNode node, String campo) {
        if (node == null) return null;
        JsonNode valor = node.path(campo);
        return valor.isTextual() && StringUtils.hasText(valor.asText()) ? valor.asText() : null;
    }

    private static String firstNonBlank(String a, String b) {
        return a != null ? a : b;
    }

    private LumenRankingResponse parseResponse(String content, List<Inscricao> novos) {
        String json = extractJsonArray(content);
        try {
            Set<Integer> idsValidos = novos.stream().map(Inscricao::getId).collect(Collectors.toSet());
            List<CandidatoRanking> ranking = new ArrayList<>();
            for (JsonNode item : objectMapper.readTree(json)) {
                int inscricaoId = item.path("inscricaoId").asInt(-1);
                if (!idsValidos.contains(inscricaoId)) continue;
                JsonNode c = item.path("criterios");
                // Nota calculada aqui (media ponderada dos criterios), nao "chutada" pelo modelo.
                double nota = 0.35 * criterio(c, "requisitos")
                        + 0.25 * criterio(c, "area")
                        + 0.25 * criterio(c, "motivacao")
                        + 0.15 * criterio(c, "maturidade");
                ranking.add(new CandidatoRanking(inscricaoId, item.path("nomeAluno").asText(""),
                        (int) Math.round(nota), item.path("justificativa").asText("")));
            }
            ranking.sort((x, y) -> Integer.compare(y.pontuacao(), x.pontuacao()));
            return new LumenRankingResponse(ranking,
                    "Sugestao gerada por IA. A decisao final e sempre do orientador.");
        } catch (Exception ex) {
            log.warn("Falha ao interpretar resposta da Lumen AI: {}", ex.getMessage());
            return new LumenRankingResponse(List.of(),
                    "Nao foi possivel interpretar a resposta da IA. Tente novamente.");
        }
    }

    private static int criterio(JsonNode criterios, String nome) {
        return Math.max(0, Math.min(10, criterios.path(nome).asInt(0)));
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
