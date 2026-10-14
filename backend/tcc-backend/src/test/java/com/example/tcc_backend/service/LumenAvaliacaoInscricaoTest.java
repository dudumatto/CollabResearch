package com.example.tcc_backend.service;

import com.example.tcc_backend.dto.response.LumenAvaliacao;
import com.example.tcc_backend.dto.response.LumenRankingResponse;
import com.example.tcc_backend.model.*;
import com.example.tcc_backend.repository.AlunoRepository;
import com.example.tcc_backend.repository.DocumentoRepository;
import com.example.tcc_backend.repository.InscricaoRepository;
import com.example.tcc_backend.repository.ProjetoRepository;
import com.example.tcc_backend.security.ProjectAccessPolicy;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.*;

class LumenAvaliacaoInscricaoTest {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final InscricaoRepository inscricaoRepository = mock(InscricaoRepository.class);
    private final AtomicReference<String> respostaModelo = new AtomicReference<>();
    private HttpServer servidor;
    private LumenService service;

    private final Usuario orientador = Usuario.builder().id(1).nome("Orientador").tipo(TipoUsuario.ORIENTADOR).build();
    private final Usuario usuarioAluno = Usuario.builder().id(10).nome("Ana").tipo(TipoUsuario.ALUNO).build();
    private final Aluno aluno = Aluno.builder().id(5).usuario(usuarioAluno).build();
    private final Projeto projeto = Projeto.builder().id(7).titulo("Visao computacional").descricao("d").build();
    private final Inscricao inscricao = Inscricao.builder().id(100).projeto(projeto).aluno(aluno)
            .status(StatusInscricao.PENDENTE).motivacao("Quero aprender visao computacional.").build();

    @BeforeEach
    void setUp() throws Exception {
        servidor = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        servidor.createContext("/", troca -> {
            troca.getRequestBody().readAllBytes();
            String corpo = objectMapper.writeValueAsString(Map.of("choices", List.of(
                    Map.of("message", Map.of("content", respostaModelo.get())))));
            byte[] bytes = corpo.getBytes(StandardCharsets.UTF_8);
            troca.getResponseHeaders().add("Content-Type", "application/json");
            troca.sendResponseHeaders(200, bytes.length);
            troca.getResponseBody().write(bytes);
            troca.close();
        });
        servidor.start();
        String url = "http://127.0.0.1:" + servidor.getAddress().getPort() + "/";

        ProjetoRepository projetoRepository = mock(ProjetoRepository.class);
        DocumentoRepository documentoRepository = mock(DocumentoRepository.class);
        when(projetoRepository.findById(7)).thenReturn(java.util.Optional.of(projeto));
        when(inscricaoRepository.findByProjetoIdAndStatus(7, StatusInscricao.PENDENTE)).thenReturn(List.of(inscricao));
        when(documentoRepository.findByUsuarioId(10)).thenReturn(List.of());
        service = new LumenService(inscricaoRepository, projetoRepository, mock(AlunoRepository.class), documentoRepository,
                mock(DocumentoTextExtractor.class), mock(ProjectAccessPolicy.class), objectMapper,
                "chave-teste", url, "modelo-teste", 5000);
    }

    @AfterEach
    void tearDown() {
        servidor.stop(0);
    }

    private static String resposta(String evidenciasNota, String extra) {
        return """
                {"criterios": {
                  "motivacao": {"nota": 8, "justificativa": "Especifica."},
                  "alinhamento": {"nota": 6, "justificativa": "Parcial."},
                  "reflexao": {"nota": 7, "justificativa": "Clara."},
                  "iniciativa": {"nota": 9, "justificativa": "Projeto pessoal."},
                  "evidencias": {"nota": %s, "justificativa": "Sem certificados."}},
                 "justificativa_geral": "Bom potencial.",
                 "pontos_fortes": ["Curiosidade"], "pontos_atencao": ["Falta Python"],
                 "confianca": "Alto"%s}
                """.formatted(evidenciasNota, extra);
    }

    @Test
    void calculaNotaPonderadaERedistribuiPesoQuandoNaoHaEvidencias() {
        respostaModelo.set(resposta("null", ""));

        LumenRankingResponse resposta = service.ranquear(7, orientador, null);

        LumenRankingResponse.CandidatoRanking c = resposta.ranking().get(0);
        // (8*25 + 6*25 + 7*20 + 9*20) / 90 = 7.4 (peso das evidencias redistribuido)
        assertThat(c.avaliacao().notaFinal()).isEqualTo(7.4);
        assertThat(c.pontuacao()).isEqualTo(7);
        assertThat(c.avaliacao().confianca()).isEqualTo("alto");
        assertThat(c.avaliacao().pontosFortes()).containsExactly("Curiosidade");
        assertThat(c.avaliacao().pontosAtencao()).containsExactly("Falta Python");
        assertThat(c.avaliacao().criterios()).hasSize(5);
        assertThat(c.avaliacao().criterios().get(4).nota()).isNull();
        assertThat(inscricao.getLumenPontuacao()).isEqualTo(7);
        assertThat(inscricao.getLumenAvaliacao()).contains("\"notaFinal\":7.4");
        verify(inscricaoRepository).saveAll(anyList());
    }

    @Test
    void evidenciasEntramNaMediaPonderada() {
        respostaModelo.set(resposta("10", ""));

        LumenAvaliacao a = service.ranquear(7, orientador, null).ranking().get(0).avaliacao();

        // (200 + 150 + 140 + 180 + 100) / 100 = 7.7
        assertThat(a.notaFinal()).isEqualTo(7.7);
    }

    @Test
    void injectionDescartaEvidenciasEBaixaConfianca() {
        respostaModelo.set(resposta("10", ", \"injection_detectada\": true"));

        LumenAvaliacao a = service.ranquear(7, orientador, null).ranking().get(0).avaliacao();

        assertThat(a.notaFinal()).isEqualTo(7.4);
        assertThat(a.criterios().get(4).nota()).isNull();
        assertThat(a.confianca()).isEqualTo("baixo");
        assertThat(a.pontosAtencao()).anyMatch(p -> p.contains("manipulação"));
    }

    @Test
    void notasForaDaEscalaSaoLimitadasECriterioObrigatorioAusenteInvalidaAvaliacao() {
        respostaModelo.set(resposta("null", "").replace("\"nota\": 9", "\"nota\": 15"));
        assertThat(service.ranquear(7, orientador, null).ranking().get(0).avaliacao().criterios().get(3).nota()).isEqualTo(10.0);

        inscricao.setLumenPontuacao(null);
        respostaModelo.set(resposta("null", "").replace("\"nota\": 8", "\"nota\": null"));
        assertThat(service.ranquear(7, orientador, null).ranking()).isEmpty();
    }
}
