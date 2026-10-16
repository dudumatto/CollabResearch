package com.example.tcc_backend.controller;

import com.example.tcc_backend.dto.request.LumenRankingRequest;
import com.example.tcc_backend.dto.response.LumenRankingResponse;
import com.example.tcc_backend.dto.response.LumenRecomendacaoResponse;
import com.example.tcc_backend.model.LumenRecomendacao;
import com.example.tcc_backend.model.TipoUsuario;
import com.example.tcc_backend.model.Usuario;
import com.example.tcc_backend.repository.AlunoRepository;
import com.example.tcc_backend.repository.LumenRecomendacaoRepository;
import com.example.tcc_backend.security.AuthHelper;
import com.example.tcc_backend.service.LumenService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/lumen")
@RequiredArgsConstructor
@Tag(name = "Lumen AI", description = "Analise assistida por IA das inscricoes de um projeto")
public class LumenController {

    private final LumenService lumenService;
    private final AuthHelper authHelper;
    private final AlunoRepository alunoRepository;
    private final LumenRecomendacaoRepository recomendacaoRepository;
    private final ObjectMapper objectMapper;

    @Operation(summary = "Ranquear inscricoes pendentes",
            description = "Usa IA para sugerir um ranking de compatibilidade das inscricoes pendentes de um projeto. Apenas o orientador responsavel (ou admin) pode executar.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Ranking gerado com sucesso"),
            @ApiResponse(responseCode = "403", description = "Acesso negado"),
            @ApiResponse(responseCode = "404", description = "Projeto nao encontrado"),
            @ApiResponse(responseCode = "503", description = "Lumen AI indisponivel ou nao configurada")
    })
    @PostMapping("/ranquear/{projetoId}")
    public ResponseEntity<LumenRankingResponse> ranquear(@PathVariable Integer projetoId,
                                                         @RequestBody(required = false) LumenRankingRequest request) {
        Usuario usuario = authHelper.getCurrentUser();
        return ResponseEntity.ok(lumenService.ranquear(projetoId, usuario, request == null ? null : request.inscricaoIds()));
    }

    @Operation(summary = "Recomendar projetos ao aluno",
            description = "Usa IA para comparar o perfil do aluno autenticado com os projetos abertos e sugerir os 3 mais aderentes, com justificativa.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Recomendacoes geradas com sucesso"),
            @ApiResponse(responseCode = "403", description = "Apenas alunos"),
            @ApiResponse(responseCode = "503", description = "Lumen AI indisponivel ou nao configurada")
    })
    @PostMapping("/recomendar-projetos")
    public ResponseEntity<LumenRecomendacaoResponse> recomendarProjetos() throws JsonProcessingException {
        Usuario usuario = authHelper.getCurrentUser();
        LumenRecomendacaoResponse resposta = lumenService.recomendarProjetos(usuario);
        if (resposta.recomendacoes() != null && !resposta.recomendacoes().isEmpty()) {
            LumenRecomendacao registro = new LumenRecomendacao();
            registro.setAluno(alunoRepository.findByUsuarioId(usuario.getId()).orElseThrow());
            registro.setResultado(objectMapper.writeValueAsString(resposta));
            recomendacaoRepository.save(registro);
        }
        return ResponseEntity.ok(resposta);
    }

    @Operation(summary = "Ultima recomendacao do aluno",
            description = "Retorna a ultima analise Lumen salva do aluno autenticado, sem chamar a IA. 204 se nunca analisou.")
    @GetMapping("/recomendar-projetos")
    public ResponseEntity<LumenRecomendacaoResponse> ultimaRecomendacao() throws JsonProcessingException {
        Usuario usuario = authHelper.getCurrentUser();
        if (usuario == null || usuario.getTipo() != TipoUsuario.ALUNO) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Apenas alunos");
        }
        var registro = alunoRepository.findByUsuarioId(usuario.getId())
                .flatMap(a -> recomendacaoRepository.findFirstByAlunoIdOrderByDataCriacaoDescIdDesc(a.getId()));
        if (registro.isEmpty()) return ResponseEntity.noContent().build();
        return ResponseEntity.ok(objectMapper.readValue(registro.get().getResultado(), LumenRecomendacaoResponse.class));
    }
}
